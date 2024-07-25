import * as readline from 'node:readline/promises'
import *  as fs from 'fs';
import { execSync, exec, spawnSync } from 'child_process';
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
    const connection = execSync('nmcli device status')
    const output = connection.toString();
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
  } else if (option == "2") {
    const connection = execSync('nmcli device status')
    let selectedInterfaceName=""
    const output = connection.toString();
    let lines = output.split('\n').filter(line => line.trim().length > 0);

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
    const iwconfig_out = execSync(`iw dev ${selectedInterfaceName} link`) 
    const out = iwconfig_out.toString();
    lines = out.split('\n').filter(line => line.trim().length > 0);

    const essid = lines[1].split(/\s+/)[2]
    const frequency = lines[2].split(/\s+/)[2];
    const downSpeed = lines[6].split(/\s+/)[3]+lines[6].split(/\s+/)[4]
    const upSpeed = lines[7].split(/\s+/)[3]+lines[7].split(/\s+/)[4]
    const powerOutput = execSync(`iw dev ${selectedInterfaceName} get power_save`)
    const powerManagement = powerOutput.toString()
    let powerWarning = ""
    if (powerManagement == 'on') {powerWarning = `\x1b[33m[*]\x1b[0m This can limite the speed. Change using: $ sudo iw dev ${selectedInterfaceName} set power_save off`}

    process.stdout.write(`ESSID: ${essid}\n`)
    process.stdout.write(`Frequency: ${frequency}\n`)
    process.stdout.write(`Download: ${downSpeed}\n`)
    process.stdout.write(`Upload: ${upSpeed}\n`)
    process.stdout.write(`${powerManagement}   ${powerWarning}`)
    process.stdout.write('\n')
  } else if (option == "3") {
    const connection = execSync('ip l show')
    const output = connection.toString();
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
  } else if (option == "4") {
    let errorDns = ""
    const dns_list = execSync('cat /etc/resolv.conf')
    const output = dns_list.toString();
    const servers = output.split('\n').filter(line => line.trim().length > 0);
    process.stdout.write("---------- DNS Server Info ----------\n")
    process.stdout.write(`Checking ${servers.length-1} DNS Servers\n`)
    for (let i=1; i < servers.length; i++) {
      let dns_address = servers[i].split(' ')[1]
      let dns_ping = execSync(`ping -W 3 -c 1 ${dns_address}`);
      process.stdout.write(`Salida => ${dns_ping.toString()}`)
    }
    process.stdout.write("\x1b[33m[*]\x1b[0m All DNS Servers checked\n");
    process.stdout.write("Is recommendend remove the DNS if it not work\n");
    process.stdout.write(`$ sudo sed -i '/${errorDns}/d' /etc/resolv.conf\n`)
  } else if (option == "5") {
    const firewall_rules = execSync('sudo iptables -L')
    const output = firewall_rules.toString();
    const rules = output.split('\n').filter(line => line.trim().length > 0);
    process.stdout.write("---------- Firewall Rules Info ----------\n");
    for (let i=0; i < rules.length; i+=2) {
      const columns = rules[i].split(/\s+/)
      process.stdout.write(`\x1b[33m${columns[1]}:\x1b[0m ${columns[3].slice(0, -1)}\n`)
    }
    process.stdout.write('---- If one is not "ACCEPT" you can change it ----\n')
    process.stdout.write("$ sudo iptables -P INPUT ACCEPT\n")
    process.stdout.write("$ sudo iptables -P OUTPUT ACCEPT\n")
  }
}
async function solve_sound() {
  process.stdout.write("---------- Sound Options ----------")
  process.stdout.write("\n\x1b[31m[0]\x1b[0m Back\n\x1b[33m[1]\x1b[0m Don't detect output\n\x1b[33m[2]\x1b[0m Don't play sound\n\x1b[33m[3]\x1b[0m Can't detect input\n")
  const option = await terminal.question(">> ");

  const soundDaemon = await new Promise<String>((resolve) => {
    exec('ps -e | grep -E "pulseaudio|jackd|pipewire|alsa"', (error, stdout) => {
      if (error) {
        resolve("\x1b[31m[-] No sound daemon detected...\x1b[0m");
        return;
      }
      let lines = stdout.split('\n').filter(line => line.trim().length > 0);
      let soundDaemon = lines[0].split(/\s+/)[4]
      resolve(soundDaemon);
    });
  });

  if (option == "1") {
    process.stdout.write("---------- Output Devices ----------\n")
    if (soundDaemon == "pulseaudio") {
      const soundOutputs = execSync('pactl list sinks');
      const output = soundOutputs.toString();
      const lines = output.split('\n').filter(line => line.trim().length > 0);
      for (let i=0; i < lines.length; i++) {
        let columns = lines[i].split(/\s+/)
        if (columns[1].includes("#")) {
          let state = lines[i+1].split(/\s+/)[2];
          let id = lines[i+2].split(/\s+/)[2];
          let alias = lines[i+3].split(/\s+/).slice(2).join(' ');
          let muted = lines[i+8].split(/\s+/)[2];
          let info = lines[i+42].split(/\s+/).slice(3).join(' ').slice(1,-1);

          process.stdout.write(`State: ${state}\nId: ${id}\nAlias: ${alias}\nMuted: ${muted}\nInfo: ${info}\n\n`)
        }
      }
    } else if (soundDaemon == "jackd") {
      const soundOutputs = execSync('jack_lsp');
      const output = soundOutputs.toString()
      const lines = output.split('\n').filter(line => line.trim().length > 0);
      for (let i=0; i < lines.length; i++) {
        if (!lines[i].includes("capture")) {
          process.stdout.write(lines[i])
        }
      }
    } else if (soundDaemon == "alsa") {
      const soundOutputs = execSync('aplay -l');
      const output = soundOutputs.toString().split('\n').slice(1).join('\n');
      process.stdout.write(output);
    } else {
      process.stdout.write("\x1b[31m[!]\x1b[0m Err: No sound daemon detected.")
    }
  } else if (option == "2") {
    process.stdout.write("---------- Restart Daemons ----------\n")
    if (soundDaemon == "pulseaudio") {
      execSync('pulseaudio -k && pulseaudio --start')
      process.stdout.write("\x1b[33m[*]\x1b[0m Info: pulseaudio restarted")
    } else if (soundDaemon == "jackd") {
      execSync('jack_control stop && jack_control start')
      process.stdout.write("\x1b[33m[*]\x1b[0m Info: jack restarted")
    } else if (soundDaemon == "alsa") {
      execSync('sudo alsa force-reload')
      process.stdout.write("\x1b[33m[*]\x1b[0m Info: alsa restarted")
    } else {
      process.stdout.write("\x1b[31m[!]\x1b[0m Err: Sound daemon not detected")
    }
  } else if (option == "3") {
    process.stdout.write("---------- Input Devices ----------\n")
    if (soundDaemon == "pulseaudio") {
      const soundOutputs = execSync('pactl list sources');
      const output = soundOutputs.toString();
      const lines = output.split('\n').filter(line => line.trim().length > 0);
      for (let i=0; i < lines.length; i++) {
        let columns = lines[i].split(/\s+/)
        if (columns[1].includes("#")) {
          let state = lines[i+1].split(/\s+/)[2];
          let id = lines[i+2].split(/\s+/)[2];
          let alias = lines[i+3].split(/\s+/).slice(2).join(' ');
          let muted = lines[i+8].split(/\s+/)[2];
          let info = lines[i+42].split(/\s+/).slice(3).join(' ').slice(1,-1);

          process.stdout.write(`State: ${state}\nId: ${id}\nAlias: ${alias}\nMuted: ${muted}\nInfo: ${info}\n\n`)
        }
      }
      process.stdout.write("")
    } else if (soundDaemon == "jackd") {
      const soundInputs = execSync('jack_lsp');
      const output = soundInputs.toString();
      const lines = output.split('\n').filter(line => line.trim().length > 0);
      for (let i=0; i < lines.length; i++) {
        if (lines[i].includes("capture")) {
          process.stdout.write(lines[i])
        }
      }
    } else if (soundDaemon == "alsa") {
      const soundInputs = execSync('arecord -l');
      const output = soundInputs.toString().split('\n').slice(1).join('\n')
      process.stdout.write(output)
    } else {
      process.stdout.write("\x1b[31m[!]\x1b[0m Err: No sound daemon detected.")
    }
  }
}
function package_man() {
  const osReleaseContent = fs.readFileSync('/etc/os-release', 'utf8');
  if (osReleaseContent.includes('ID_LIKE=debian') || osReleaseContent.includes('ID_LIKE=ubuntu')) {
    return {man:'apt', upd:'update\napt upgrade', mirrors:'/etc/apt/sources.list'}
  } else if (osReleaseContent.includes('ID_LIKE=fedora')) {
    return {man:'dnf', upd:'update', mirrors:'/etc/yum.repos.d/*.repo'}
  } else if (osReleaseContent.includes('ID_LIKE=centos') || osReleaseContent.includes('ID_LIKE="rhel"')) {
    return {man:'yum', upd:'update', mirrors:'/etc/yum.repos.d/*.repo'};
  } else if (osReleaseContent.includes('ID_LIKE=arch')) {
    return {man:'pacman', upd:'-Syu', mirrors:'/etc/pacman.d/mirrorlist'};
  } else if (osReleaseContent.includes('ID_LIKE=opensuse')) {
    return {man:'zypper', upd:'update', mirrors:'/etc/yum.repos.d/*.repo'};
  } else if (osReleaseContent.includes('ID_LIKE=alpine')) {
    return {man:'apk', upd:'update\napk upgrade', mirrors:'/etc/apk/repositories'}
  } else {
    return 'error fetching package manager'
  }
}
async function solve_pack_man() {
  const packageManager = package_man()
  if (typeof packageManager != 'object') {return 1}
  process.stdout.write(`Package manager: ${packageManager.man}\n`)
  process.stdout.write(`Update command: sudo ${packageManager.upd}\n`)
  process.stdout.write('\x1b[31m[0] \x1b[0mBack\n\x1b[33m[1] \x1b[0mCheck Mirrors    \x1b[33m[2]\x1b[0m\n')
  const option = await terminal.question('>> ')
  if (option == "0") {return 0}
  else if (option == "1") {
    // const mirrorsFile = fs.readFileSync(packageManager.mirrors, 'utf-8');
    const mirrorsList = execSync(`cat ${packageManager.mirrors} | grep http`)
    let mirrors_servers = mirrorsList.toString().split('\n')
    process.stdout.write(`Scanning ${mirrors_servers.length} servers\n`)
    for (let i=112; i < mirrors_servers.length; i+=3) {
      let server_address = mirrors_servers[i].split(/\s+/)
      let server_domain = server_address[2].split('/')[2]
      let server_result = spawnSync('ping', ['-w', '3', '-c', '1', server_domain], {encoding: 'utf-8'});
      if (server_result.status == 0) {
        process.stdout.write(`\x1b[31m[-] \x1b[0m${server_address[0]} not responding.\n`)
      } else {
        process.stdout.write(`\x1b[32m[+] \x1b[0m${server_address[2]} is ok.\n`)
      }
    }
  }
}
async function main() {
  while (true) {
    console.clear()
    process.stdout.write('\x1b[31m[0]\x1b[0m Exit\n\x1b[33m[1]\x1b[0m Solve Wi-Fi    \x1b[33m[2]\x1b[0m Solve Sound\n\x1b[33m[3]\x1b[0m Solve package manager\x1b[0m\n\x1b[33m[99]\x1b[0m Sleipgar Assistant\n')
    const action = await terminal.question('>>')
    if (action == "0") {process.exit(0)}
    if (action == "1") {
      await solve_wifi().then(async() => {await terminal.question('Press [Enter] to clear...')})
    } else if (action == "2") {
      await solve_sound().then(async() => {await terminal.question('Press [Enter] to clear...')})
    } else if (action == "3") {
      await solve_pack_man().then(async() => {await terminal.question('Press [Enter] to clear...')})
    } else if (action == "99") {
      await sleipgar_assistant()
    }
  }
}

main().catch(console.error)
