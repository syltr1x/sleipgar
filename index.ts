import * as readline from 'node:readline/promises'
import { streamText, type CoreMessage } from 'ai' // vercel sdk AI
import { google } from '@ai-sdk/google';
import dotenv from 'dotenv'
dotenv.config()

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const messages: CoreMessage[] = []

async function main() {
  while (true) {
    const userInput = await terminal.question('Tú: ')
    messages.push({ role: 'user', content: userInput })

    const result = await streamText({
      model:  google('models/gemini-1.5-pro-latest'),
      system: 'Eres un asistente experto en linux de 47 años y debes tratar de solucionar mis problemas a toda costa, que habla con expresiones tecnicas pero que puedan entender todos, no exageres con ser demasiado acogedor, haz algun chiste cada 5 mensajes pero normalmente se frío',
      messages,
    })

    let fullResponse = ''
    process.stdout.write('\nSleipgar: ')

    for await (const part of result.textStream) {
      fullResponse += part
      process.stdout.write(part)
    }
      process.stdout.write('\n\n')
      messages.push({ role: 'assistant', content: fullResponse })
  }
}

main().catch(console.error)