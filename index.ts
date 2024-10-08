import * as readline from 'node:readline/promises'
import *  as fs from 'fs';
import { execSync, exec, spawnSync } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import { type CoreMessage, streamText } from 'ai'
import { google } from '@ai-sdk/google';
import dotenv from 'dotenv'
dotenv.config()

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

async function save_log_messages(messages: CoreMessage[]) {
  // Obtain date
  const jNow = new Date();
  const Day = String(jNow.getDate()).padStart(2, '0');
  const Month = String(jNow.getMonth() + 1).padStart(2, '0');
  const Year = jNow.getFullYear();
  const Hour = String(jNow.getHours()).padStart(2, '0');
  const Minutes = String(jNow.getMinutes()).padStart(2, '0');
  const Seconds = String(jNow.getSeconds()).padStart(2, '0');
  const formattedDate = `${Day}-${Month}-${Year}_${Hour}:${Minutes}:${Seconds}`;
  // Create Log File
  try {
    await fs.promises.writeFile(formattedDate, JSON.stringify(messages, null, 2), 'utf8');
    return `\x1b[32m[+]\x1b[0m Log saved at ${formattedDate}`;
  } catch (e) {
    return `\x1b[31m[-]\x1b[0m Err saving log: ${e}`;
  }
}
async function sleipgar_assistant() {
  if (process.env['GOOGLE_GENERATIVE_AI_API_KEY'] === undefined) {
    process.stdout.write('\x1b[31m[!]\x1b[0m You need to configure an aistudio api key to use assistant\n')
    return 1
  }
  const user = os.userInfo().username;
  const linuxDistro = execSync("cat /etc/os-release | grep '^ID=' | awk -F= '{print $2}'").toString().trim()
  const desktopEnviroment = execSync("cat ~/.dmrc | tail -1 | awk -F= '{print $2}'").toString().trim()
  const systemLanguage = execSync("echo $LANG | awk -F. '{print $1}'").toString().trim()
  const sessionServer = execSync("ps e | grep untraceable_keyword | tr ' ' '\n' | grep -e 'GREETER_DATA_DIR' | awk -F= '{print $2}'").toString().trim().split('\n')[0]
  const grapichServer = execSync("ps e | grep untraceable_keyword | tr ' ' '\n' | grep -e 'SESSION_TYPE' | awk -F= '{print $2}'").toString().trim().split('\n')[0]
  let base_info = "You are a 47 year old linux expert and you must try to solve my problems at all costs, you speak in technical expressions but that everyone can understand, don't overdo it with being too welcoming, make a joke every 5 messages but normally be cold."

  const messages: CoreMessage[] = []
  process.stdout.write("\nDo you want send this info to assistant:\n")
  process.stdout.write(`Linux distro: ${linuxDistro}\n`)
  process.stdout.write(`Session server path: ${sessionServer}\n`)
  process.stdout.write(`Graphic server: ${grapichServer}\n`)
  process.stdout.write(`Desktop Enviroment: ${desktopEnviroment}\n`)
  process.stdout.write(`Language: ${systemLanguage}\n\n`)
  const dataVerify = await terminal.question('[Y/n] >> ')
  if (dataVerify != "n" && dataVerify != "N") {
    base_info = `I am using ${linuxDistro} and my session server path is: ${sessionServer}. ${grapichServer} as graphic server with ${desktopEnviroment} desktop enviroment, please answer me in ${systemLanguage}. `+base_info
  }
  console.clear()
  process.stdout.write('\x1b[33m[*]\x1b[0m To exit the chat write "bye"\n')
  while (true) {
    const userInput = await terminal.question(`${user}: `)
    if (userInput.length < 1) {process.stdout.write('\x1b[31m[*]\x1b[0m Please enter a message.\n'); continue}
    if (userInput === 'bye') {
      const logVerify = await terminal.question('Do you want save messages log [Y/n] >> ')
      if (logVerify.toLowerCase() === 'n') {break}
      await save_log_messages(messages).then((response) => {process.stdout.write(`\n${response}\n`)})
      break
    }
    messages.push({ role: 'user', content: userInput })

    const result = await streamText({
      model:  google('models/gemini-1.5-pro-latest'),
      system: base_info,
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
  process.stdout.write("\n\x1b[31m[0]\x1b[0m Back\n\x1b[33m[1]\x1b[0m Basic interfaces info\n\x1b[33m[2]\x1b[0m Network info\n\x1b[33m[3]\x1b[0m Complete interfaces info")
  process.stdout.write("\n\x1b[33m[4]\x1b[0m Check DNS Servers \n\x1b[33m[5]\x1b[0m Firewall info\n")
  let option = await terminal.question('\n>>') 
  if (option == "0") {return 0}
  if (option == "1") {
    const connection = execSync('nmcli device status')
    const output = connection.toString();
    const lines = output.split('\n').filter(line => line.trim().length > 0);

    let hasInterfaceConnected = false;
    process.stdout.write("---------- Interfaces Info ----------\n")
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
  process.stdout.write('\x1b[31m[0] \x1b[0mBack\n\x1b[33m[1] \x1b[0mCheck mirrors    \x1b[33m[2]\x1b[0m\n')
  if (packageManager.man == "pacman") {process.stdout.write("\x1b[33m[3] \x1b[0mAdd AUR Packages (Arch User Repositories)\n")}
  const option = await terminal.question('>> ')
  if (option == "0") {return 0}
  else if (option == "1") {
    let exec_promise = promisify(exec); 
    const mirrorsList = execSync(`cat ${packageManager.mirrors} | grep http`)
    let mirrors_servers = mirrorsList.toString().split('\n')
    process.stdout.write(`\x1b[33m[*] \x1b[0mScanning ${mirrors_servers.length} mirrors...\n`)
    const mirrorsScan = await exec_promise("cat "+packageManager.mirrors+" | grep http | awk '{print $3}' | xargs -P 10 -I {} bash -c 'result=$(curl -Is {} -o /dev/null -w"+' "%{http_code} %{time_total}\n" -s); printf "%-70s %s\n" "{}" "[$(echo "$result" | awk "{print \$1}")] $(echo "$result" | awk "{print \$2}")s"'+"'")
    process.stdout.write(mirrorsScan.stdout)
  } else if (option == "2") {
    process.stdout.write('')
  } else if (option == "3" && packageManager.man == "pacman") {
    const checkExistentAURH = (commands: string[]): string => {
      for (let helper of commands) {
        let aur_helper_out = spawnSync('which', [helper])
        if (aur_helper_out.status == 0) {return helper}
      }
      return ""
    }
    let aur_helpers = ['yay', 'paru', 'trizen']
    const existentAURHelper: string = checkExistentAURH(aur_helpers);
    process.stdout.write('Select an "AUR Helper"\n')
    if (existentAURHelper != "") {aur_helpers[aur_helpers.indexOf(existentAURHelper)] = `${existentAURHelper} (installed)`}
    process.stdout.write(`\x1b[31m[0] \x1b[0mBack\n\x1b[33m[1] \x1b[0m${aur_helpers[0]}\n\x1b[33m[2] \x1b[0m${aur_helpers[1]}\n\x1b[33m[3] \x1b[0m${aur_helpers[2]}\n`)
    const aur_helper = await terminal.question('>> ')
    if (aur_helper == "0") {return 0}
    else if (aur_helper != "0" && aur_helpers[parseInt(aur_helper)].includes('(installed)')) {
      execSync(`sudo pacman -Rns ${aur_helpers[parseInt(aur_helper)].split(/\s+/)[0]}-git`)
    } else {
      execSync(`git clone https://aur.archlinux.org/${aur_helpers[parseInt(aur_helper)].split(/\s+/)[0]}.git ~/${aur_helpers[parseInt(aur_helper)].split(/\s+/)[0]}`)
      execSync(`cd ~/${aur_helpers[parseInt(aur_helper)].split(/\s+/)[0]}`)
      execSync('makepkg -si')
    }
  }
}
async function solve_apps() {
  const appDirectory = await terminal.question('App directory >> ')
  const dirContent = spawnSync('ls', [appDirectory.trim()])
  let commands: Array<string> = ['\x1b[33m[*] \x1b[0mCommands to execute:']
  if (dirContent.status != 0) {
    process.stdout.write(`Please verify your path: ${appDirectory}\n`)
    await solve_apps()
    return 0
  }
  let dir_content = dirContent.stdout.toString().split('\n').filter(content => content.trim().length > 0)

  if (dir_content.includes('package.json')) {
    commands.push('npm install')
    if (dir_content.includes('index.ts')) {commands.push('npx tsc')}
    else if (dir_content.includes('index.js')) {commands.push('node index.js')}
  }
  else if (dir_content.includes('PKGBUILD')) {commands.push('makepkg -si')}
  else if (dir_content.includes('CMakeLists.txt')) {commands.push('cmake ..', 'make install')}

  if (commands.length == 1) {
    console.log('\x1b[31m[0] \x1b[0mBack')
    for (let i = 0; i < dir_content.length; i += 3) {
      const item1 = dir_content[i] ? `\x1b[33m[${i+1}] \x1b[0m${dir_content[i]}` : '';
      const item2 = dir_content[i+1] ? `\x1b[33m[${i+2}] \x1b[0m${dir_content[i + 1]}` : '';
      const item3 = dir_content[i+2] ? `\x1b[33m[${i+3}] \x1b[0m${dir_content[i + 2]}` : '';
      process.stdout.write(`${item1.padEnd(30)} ${item2.padEnd(30)} ${item3}\n`);
    }
    let selected_file = await terminal.question('Select file >> ')
    if (selected_file == "0") {return 0}
    const appFile = dir_content[parseInt(selected_file)-1]
    const fileExtension = appFile.split('.')[appFile.split('.').length-1]
    let app_dir = appDirectory
    if (app_dir.endsWith('/')) {app_dir = app_dir.slice(0, -1)}
    if (fileExtension == "txz" || fileExtension == "xz") {
      commands.push(`tar -xf ${app_dir}/${appFile} -o ${appFile.split('.')[0]}`, `rm ${appFile}`)
    } else if (fileExtension == "sh") {
      commands.push(`sudo chmod +x ${app_dir}/${appFile}`, `./${appFile}`)
    } else if (fileExtension == "deb") {
      commands.push(`sudo dpkg -i ${app_dir}/${appFile}`)
    } else if (fileExtension == "gz" || fileExtension == "taz" ||  fileExtension == "tgz") {
      commands.push(`gzip -d ${app_dir}/${appFile}`)
    } else if (fileExtension == "tb2" || fileExtension == "tbz" || fileExtension == "tbz2" || fileExtension == "tz2") {
      commands.push(`bzip2 -d ${app_dir}/${appFile}`)
    } else if (fileExtension == "AppImage") {
      commands.push(`chmod +x ${app_dir}/${appFile}`)
    } else {
      process.stdout.write(`\x1b[31m[*]\x1b[0m Not supported file format: ${fileExtension}\n`)
      process.stdout.write('\x1b[33m[*]\x1b[0m Check available version in: github.com/syltr1x/sleipgar\n')
      return 0
    }
    if (fileExtension != "sh") {commands.push('ls')}
  }
  commands.forEach((command) => {process.stdout.write(`${command}\n`)})
  const execVerify = await terminal.question('want proceed? [Y/n] >>')
  if (execVerify.toLowerCase() == "n") {return 0}
  commands.shift()
  commands.forEach((command) => {execSync(command)})
  process.stdout.write('\x1b[32m[+]\x1b[0m App installed succesfully!\n')
}
async function process_manager() {
  const processName = await terminal.question('process name > ')
  let process_info = execSync(`ps faux | grep ${processName} | wc -l`).toString()
  if (parseInt(process_info) > 2) {process_info = execSync(`ps faux | grep ${processName} | tail -${parseInt(process_info)-2}`).toString()}
  else {process.stdout.write(`\n\x1b[31m[*]\x1b[0m Err: Process "${processName} doesn't exist."\n`); return 1}
  const processID = process_info.split(/\s+/)[1]
  const runningTime = process_info.split(/\s+/)[8]
  const processMonitor = execSync(`ps -p ${processID} -o %cpu,%mem,comm | awk 'NR==2'`).toString().split(/\s+/)
  const cpuUSage = processMonitor[1]
  const memUsage = processMonitor[2]
  const processTitle = processMonitor[3]

  process.stdout.write(`\nProcess name: ${processTitle}\n`)
  process.stdout.write(`Process ID: ${processID}\n`)
  process.stdout.write(`CPU usage: ${cpuUSage}\n`)
  process.stdout.write(`Memory usage: ${memUsage}\n`)
  process.stdout.write(`Running since: ${runningTime}\n`)
  process.stdout.write('-------------------------------\n')
  process.stdout.write('\x1b[31m[0]\x1b[0m Back\n\x1b[33m[1]\x1b[0m Kill     \x1b[33m[2]\x1b[0m Elevate priority\n\x1b[33m[3]\x1b[0m Restart  \x1b[33m[4]\x1b[0m File usage\n')
  const option = await terminal.question('>>')
  if (option == "0") {return 0}
  else if (option == "1") {execSync(`kill ${processID}`)}
  else if (option == "2") {execSync(`sudo renice -n -20 -p ${processID}`)}
  else if (option == "3") {execSync(`kill -HUP ${processID}`)}
  else if (option == "4") {execSync(`lsof -p ${processID}`)}
  else {process.stdout.write('\x1b[31m[-]\x1b[0m Err: inexistent action...'); return 1}
}

async function main() {
  while (true) {
    console.clear()
    process.stdout.write('\x1b[31m[0]\x1b[0m Exit\n\x1b[33m[1]\x1b[0m Solve Wi-Fi    \x1b[33m[2]\x1b[0m Solve Sound\n\x1b[33m[3] \x1b[0mInstall Help   \x1b[33m[4]\x1b[0m Packages help\n\x1b[33m[5]\x1b[0m Process manager\n\x1b[33m[99]\x1b[0m Sleipgar Assistant\n')
    const action = await terminal.question('>>')
    if (action == "0") {process.exit(0)}
    if (action == "1") {
      await solve_wifi().then(async() => {await terminal.question('Press [Enter] to clear...')})
    } else if (action == "2") {
      await solve_sound().then(async() => {await terminal.question('Press [Enter] to clear...')})
    } else if (action == "3") {
      await solve_apps().then(async() => {await terminal.question('Press [Enter] to clear...')})
    } else if (action == "4") {
      await solve_pack_man().then(async() => {await terminal.question('Press [Enter] to clear...')})
    } else if (action == "5") {
      await process_manager().then(async() => {await terminal.question('Press [Enter] to clear...')})
    } else if (action == "99") {
      await sleipgar_assistant().then(async() => {await terminal.question('Press [Enter] to clear...')})
    }
  }
}

main().catch(console.error)
