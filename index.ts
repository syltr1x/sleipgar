import * as readline from 'node:readline/promises'
import { spawn } from 'child_process';
import * as os from 'os';
import { type CoreMessage, streamText } from 'ai'
import { google } from '@ai-sdk/google';
import dotenv from 'dotenv'
dotenv.config()

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

async function sleipgar_assistant() {
  const user = os.userInfo().username;

  const messages: CoreMessage[] = []
  process.stdout.write('\x1b[33m[*]\x1b[0m To exit the chat write "bye"\n')
  while (true) {
    const userInput = await terminal.question(`${user}: `)
    if (userInput === 'bye') {break}
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

async function solve_wifi() {
  process.stdout.write("---------- Wifi Options ----------")
  process.stdout.write("\n\x1b[31m[0]\x1b[0m Back\n\x1b[33m[1]\x1b[0m Don't have internet connection\n\x1b[33m[2]\x1b[0m Slow connection\n\x1b[33m[3]\x1b[0m Can't connect to network")
  process.stdout.write("\n\x1b[33m[4]\x1b[0m Unstable connection\n\x1b[33m[5]\x1b[0m High Latency\n")
  let option = await terminal.question('\n>>') 
  if (option == "0") {return 0}
  if (option == "1") {
    const connection = spawn('nmcli', ['device', 'status'])
    connection.stdout.on('data', (data: Buffer) => {
      const output = data.toString();
      const lines = output.split('\n').filter(line => line.trim().length > 0);

      let hasInterfaceConnected = false;
      process.stdout.write("---------- Interfaces Info ----------\n")
      // Procesar cada línea de la salida
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(/\s+/);
        const interfaceName = columns[0];
        const type = columns[1];
        const state = columns[2];
        if (state.includes('connected') || state.includes('conectado')) { hasInterfaceConnected = true; }
        const connection = columns.slice(3).join(' ');
        console.log(`\x1b[36m${interfaceName}\x1b[0m(${type}): ${state} -> ${connection}`);
      }
      if (!hasInterfaceConnected) {
        process.stdout.write("\x1b[31m[!]\x1b[0m Don't have any interface connected. Please check this commands:")
        process.stdout.write("$ nmcli device {type} connect {SSID} password {password}")
        process.stdout.write("After try to ping a url. Ex:")
        process.stdout.write("$ ping -c 1 google.es")
      }
    });
    setTimeout(async() => {process.stdout.write('Press [Enter] to clean...')}, 130)
    await terminal.question('')
  } else if (option == "2") {
    const connection = spawn('nmcli', ['device', 'status'])
    let selectedInterfaceName=""
    connection.stdout.on('data', (data: Buffer) => {
      const output = data.toString();
      const lines = output.split('\n').filter(line => line.trim().length > 0);

      process.stdout.write("---------- Interface Info ----------\n")
      // Procesar cada línea de la salida
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(/\s+/);
        const interfaceName = columns[0];
        const type = columns[1];
        const state = columns[2];
        if (state.includes('connected') || state.includes('conectado')) { selectedInterfaceName = interfaceName; break }
        const connection = columns.slice(3).join(' ');
        console.log(`\x1b[36m${interfaceName}\x1b[0m(${type}): ${state} -> ${connection}`);
      }
      if (selectedInterfaceName == "") { process.stdout.write("\x1b[31m[!]\x1b[0m Check your internet connection, maybe you're not connected\n"); return 0}
        const iwconfig_out = spawn('iwconfig', [`${selectedInterfaceName}`]) 
        iwconfig_out.stdout.on('data', (data: Buffer) => {
          const out = data.toString();
          const lines = out.split('\n').filter(line => line.trim().length > 0);

          const essid = lines[0].split(/\s+/)[3].split(":")[1].slice(1,-1);
          const frequency = lines[1].split(/\s+/)[2].split(":")[1];
          const speed = lines[2].split(/\s+/)[2].split("=")[1]
          const speedUnity = lines[2].split(/\s+/)[3];
          const powerManagement = lines[4].split(/\s+/)[2].split(":")[1];
          let powerWarning = ""
          if (powerManagement == 'on') {powerWarning = `\x1b[33m[*]\x1b[0m This can limite the speed. Change using: $ sudo iwconfig ${selectedInterfaceName} power off`}

          process.stdout.write(`ESSID: ${essid}\n`)
          process.stdout.write(`Frequency: ${frequency}\n`)
          process.stdout.write(`Speed: ${speed}${speedUnity}\n`)
          process.stdout.write(`Power Managment: ${powerManagement}   ${powerWarning}`)
          process.stdout.write('\n')
        });
    });
    setTimeout(async() => {process.stdout.write('Press [Enter] to clean...')}, 130)
    await terminal.question('')
  } else if (option == "3") {
    const connection = spawn('ip', ['l', 'show'])
    connection.stdout.on('data', (data: Buffer) => {
      const output = data.toString();
      const lines = output.split('\n').filter(line => line.trim().length > 0);

      process.stdout.write("---------- Interfaces Info ----------\n")
      // Procesar cada línea de la salida
      for (let i = 0; i < lines.length; i+=2) {
        let fisicalState = "Connected"
        let monitorWarning = ""
        const columns = lines[i].split(/\s+/);
        const interfaceName = columns[1].slice(0,-1);
        const data = columns[2];
        if (data.includes('NO-CARRIER')) {fisicalState = "Disconnected"}
        const state = columns[8];
        const mode = columns[10];
        if (mode == 'MONITOR') {monitorWarning = `\x1b[33m[!]\x1b[0m This interface is in monitor mode. To disable use: $ sudo iwconfig ${interfaceName} mode Managed`}
        process.stdout.write(`\x1b[33mName:\x1b[0m ${interfaceName}\n\x1b[33mFisical State:\x1b[0m ${fisicalState}\n\x1b[33mState:\x1b[0m ${state}\n\x1b[33mMode:\x1b[0m ${mode}   ${monitorWarning}\n`);
        process.stdout.write('\n')
      }
      process.stdout.write("---- If you interface is UP, trying restarting it ----\n")
      process.stdout.write("$ sudo ip l set {interface} down\n")
      process.stdout.write("$ sudo ip l set {interface} up\n")
    });
    setTimeout(async() => {process.stdout.write('Press [Enter] to clean...')}, 130)
    await terminal.question('')
  } else if (option == "4") {
    const dns_list = spawn('cat', ['/etc/resolv.conf'])
    let errorDns = ""
    dns_list.stdout.on('data', async(data: Buffer) => {
      const output = data.toString();
      const servers = output.split('\n').filter(line => line.trim().length > 0);
      process.stdout.write("---------- DNS Server Info ----------\n")
      process.stdout.write(`Checking ${servers.length-1} DNS Servers\n`)
      const promises = servers.slice(1).map(server => {
      const dnsAddress = server.split(/\s+/)[1];

      return new Promise<void>((resolve) => {
      const process = spawn('ping', ['-W', '3', '-c', '1', dnsAddress]);

      process.on('exit', code => {
        if (code === 0) {
          console.log(`\x1b[32m[+]\x1b[0m ${dnsAddress} is ok.`);
        } else {
          console.log(`\x1b[31m[-]\x1b[0m ${dnsAddress} doesn't work.`);
          errorDns = dnsAddress
        }
        resolve();
      });

      process.on('error', err => {
        console.error(`Error executing ping for ${dnsAddress}: ${err}`);
        resolve();
        });
      });
    });
    await Promise.all(promises);
    process.stdout.write("\x1b[33m[*]\x1b[0m All DNS Servers checked\n");
    process.stdout.write("Is recommendend remove the DNS if it not work\n");
    process.stdout.write(`$ sudo sed -i '/${errorDns}/d' /etc/resolv.conf\n`)
    setTimeout(async() => {process.stdout.write('Press [Enter] to clean...')}, 130)
    });
    await terminal.question('')
  } else if (option == "5") {
    const firewall_rules = spawn('sudo', ['iptables', '-L'])
    firewall_rules.stdout.on('data', (data: Buffer) => {
      const output = data.toString();
      const rules = output.split('\n').filter(line => line.trim().length > 0);
      process.stdout.write("---------- Firewall Rules Info ----------\n");
      for (let i=0; i < rules.length; i+=2) {
        const columns = rules[i].split(/\s+/)
        process.stdout.write(`\x1b[33m${columns[1]}:\x1b[0m ${columns[3].slice(0, -1)}\n`)
      }
      process.stdout.write('---- If one is not "ACCEPT" you can change it ----\n')
      process.stdout.write("$ sudo iptables -P INPUT ACCEPT\n")
      process.stdout.write("$ sudo iptables -P OUTPUT ACCEPT\n")
      setTimeout(async() => {process.stdout.write('Press [Enter] to clean...')}, 130)
    });
    await terminal.question('')
  }
}

async function main() {
  while (true) {
    console.clear()
    process.stdout.write('\x1b[31m[0]\x1b[0m Exit\n\x1b[33m[1]\x1b[0m Solve Wi-Fi    \x1b[33m[2]\x1b[0m Solve Sound\n\x1b[33m[99]\x1b[0m Sleipgar Assistant\n')
    const action = await terminal.question('>>')
    if (action == "0") {process.exit(0)}
    if (action == "1") {
      await solve_wifi()
    } else if (action == "99") {
      await sleipgar_assistant()
    }
  }
}

main().catch(console.error)
