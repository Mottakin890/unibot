import { NextResponse } from 'next/server'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string; numpages: number }>
import mammoth from 'mammoth'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let text = ''

    if (file.name.endsWith('.pdf')) {
      const data = await pdf(buffer)
      text = data.text
    } else if (file.name.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else if (file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.csv') || file.name.endsWith('.json')) {
      text = buffer.toString('utf-8')
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim()

    if (!text) {
      return NextResponse.json({ error: 'No text content extracted' }, { status: 400 })
    }

    return NextResponse.json({ 
      text: text.slice(0, 500000), // Safety limit 500k chars
      name: file.name,
      charCount: text.length
    })
  } catch (err) {
    console.error('[API /api/parse/file POST] Error:', err)
    return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 })
  }
}
