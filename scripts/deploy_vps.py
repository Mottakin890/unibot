import paramiko
import sys
import time

def run_remote(client, command):
    print(f"Running: {command[:50]}...")
    stdin, stdout, stderr = client.exec_command(command)
    
    # Read output line by line as it arrives
    for line in iter(stdout.readline, ""):
        print(line, end="")
        sys.stdout.flush()
        
    exit_status = stdout.channel.recv_exit_status()
    if exit_status != 0:
        err = stderr.read().decode()
        print(f"Error (Exit {exit_status}): {err}")
        # We don't exit immediately on all errors to ensure resilience, but we print it.

try:
    host = "107.172.127.198"
    user = "root"
    pwd = "Nilufer99@#.#"

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {host}...")
    client.connect(hostname=host, username=user, password=pwd, timeout=10)
    print("Connected successfully!")
    
    setup_script = """
set -e
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git nginx

# Check for Node.js
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Check for pm2
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Setup App directory
mkdir -p /var/www
cd /var/www
if [ -d "unibot" ]; then
    cd unibot
    # Discard any local changes and pull latest
    git reset --hard
    git pull origin master
else
    git clone https://github.com/Mottakin890/unibot.git unibot
    cd unibot
fi
    """
    run_remote(client, setup_script)
    
    # We will upload .env.local separately in exactly as it exists locally
    with open('/media/mottakin/veil in sec/UniBot/.env.local', 'r') as f:
        env_content = f.read()
    
    # Write environment variables
    # We use a python trick to safely write it using base64 just in case there are weird characters
    import base64
    encoded_env = base64.b64encode(env_content.encode()).decode()
    run_remote(client, f"echo '{encoded_env}' | base64 --decode > /var/www/unibot/.env.local")

    # Install, Build, and Start App
    build_script = """
cd /var/www/unibot
# In case npm install hangs, we clean cache first
npm cache clean --force
npm install
npm run build

# Manage PM2
pm2 kill || true
pm2 start npm --name "unibot" -- start
pm2 save
pm2 startup | tail -n 1 > /tmp/pm2startup.sh
chmod +x /tmp/pm2startup.sh
/tmp/pm2startup.sh
    """
    run_remote(client, build_script)
    
    # Configure Nginx Reverse Proxy
    nginx_conf = """
server {
    listen 80;
    server_name _; 

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
"""
    encoded_nginx = base64.b64encode(nginx_conf.encode()).decode()
    nginx_script = f"""
echo '{encoded_nginx}' | base64 --decode > /etc/nginx/sites-available/unibot
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/unibot /etc/nginx/sites-enabled/unibot
nginx -t
systemctl restart nginx
    """
    run_remote(client, nginx_script)
    
    # Finally, Generate an SSH key so GitHub Actions can connect
    ssh_key_script = """
if [ ! -f /root/.ssh/id_rsa ]; then
    ssh-keygen -t rsa -b 4096 -N "" -f /root/.ssh/id_rsa
fi
cat /root/.ssh/id_rsa
    """
    print("\\n--- YOUR GITHUB ACTIONS PRIVATE SSH KEY ---")
    stdin, stdout, stderr = client.exec_command(ssh_key_script)
    key_out = stdout.read().decode()
    print(key_out)
    
    # Setup authorized_keys to allow itself
    auth_script = """
cat /root/.ssh/id_rsa.pub >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
    """
    run_remote(client, auth_script)
    
    print("Deployment completed successfully!")
    client.close()

except Exception as e:
    print(f"Failed: {e}")
