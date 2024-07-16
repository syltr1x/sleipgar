## Requirements 
* Node.js (version 20.15.0 or upper)
* npm (version 10.7.0 or upper)
* Google AI Studio API key (obtain in: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey))
## Installation
Clone repository
```bash
git clone https://github.com/syltr1x/sleipgar
cd sleipgar
```
Install dependencies
```bash
npm install
```
## Configuration
You need configure Google AI Studio API key for use:
```bash
export GOOGLE_GENERATIVE_AI_API_KEY=api_key
```
or include in .env file
```
GOOGLE_GENERATIVE_AI_API_KEY=api_key
```
## Execution
You have two options to execute

1. Launch in development mode
```bash
npm run dev
```
2. Build and run application
```bash
npm run build
npm start
```