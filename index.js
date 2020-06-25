
const fs = require('fs')
const { join, basename, dirname, extname } = require("path")
const hyperswarm = require('hyperswarm')
const { createHash, randomBytes } = require('crypto')
const { encrypt, decrypt } = require('strong-cryptor')
const shortid = require('shortid')

const PACKET_DELAY_REQUEST = 1000
let globalEmitter

const joinRoom = (API,room,password, username = Math.random()) => {
	const { puffin } = API
	const userid = shortid.generate()
	const allSockets = []
	const emitter = new puffin.state({
		room,
		me:{
			username,
			userid
		},
		users: {}
	})
	const swarm = hyperswarm()
	const topic = createHash('sha256')
	.update(room)
	.digest()
	swarm.join(topic, {
		lookup: true, 
		announce: true 
	})
	swarm.on('connection', (socket, details) => {
		handleData(socket,emitter,username,password)
		allSockets.push(socket)
		emitter.emit('userFound')
		socket.on("error", err =>{
			console.log(err)
			if( err ){
				emitter.emit('err',err)
				emitter.emit('userLeft',err)
			}
		})
		emitter.on("data", ({ type, content, username: peerName}) => {
			emitter.emit(type,{
				...content,
				senderUsername: peerName
			})
		})
		emitter.emit('message',{
			type: 'identifyUser',
			content:{
				username,
				userid
			}
		})
		emitter.on('identifyUser',({ username, userird }) => {
			const usernameExists = emitter.data.users[userird] !== undefined
			emitter.data.users[userird] = {
				username,
				socket
			}
			if(!usernameExists){
				emitter.emit('userIdentified',{
					username,
					userird
				})
			}
		})
	})
	emitter.on('message',data =>{
		const computedData = {
			...data,
			username,
			userid
		}
		const msg = JSON.stringify(computedData)
		if(data.type == 'identifyUser'){
			allSockets.map( socket => {
				send(emitter,socket,msg, username, password)
			})
		}else{
			Object.keys(emitter.data.users).map( userid => {
				const { socket, username:user } = emitter.data.users[userid]
				if( user !== username ) send(emitter,socket, msg, username, password)
			})
		}
	})
	emitter.on('disconnect',() => {
		const data = {
			type: 'userDisconnected',
			content:{
				username,
				userid
			},
			username,
			userid
		}
		const msg = JSON.stringify(data)
		Object.keys(emitter.data.users).map( userid => {
			const { socket, username: user } = emitter.data.users[userid]
			if( user !== username ) send(socket, msg, username, password)
			emitter.emit('userDisconnected',{ username: user, userid })
			delete emitter.data.users[userid]
		})
	})
	return emitter
}

function handleData(socket, emitter,username, password){
	const packets = []
	const closedPackets = []
	socket.on('data', data => {
		if( data && typeof data == "object" ){
			let msg = Buffer.from(data).toString().split("__")[0]
			let error = false
			try{
				const { d } = JSON.parse(msg)
			}catch(err){
				error = err
			}
			if( !error ){
				const { i, t ,d, id, username: peerName } = JSON.parse(msg)
				if(peerName === username) return
				if(!getPacket(packets,id)){
					packets.push({
						id,
						t,
						parts: {}
					})
				}
				if(i < t){
					const packet = getPacket(packets,id)
					if(packet.parts[i]) return
					packet.parts[i] = d
				}
				if(Object.keys(getPacket(packets,id).parts).length === t){
					if(closedPackets.includes(id)) return
					let packet = getPacket(packets,id)
					let computedData = ""
					for(let c = 0;c<t;c++){
						computedData += packet.parts[c]
					}
					emitter.emit('data',JSON.parse(decrypt(computedData, password)))
					removePacket(packets,closedPackets,id)
				}else{
					setTimeout(()=>{
						const packet = getPacket(packets,id)
						if(packet && !closedPackets.includes(id)){
							const packetsNotFound = []
							for(let c = 0;c<t;c++){
								if(!packet.parts[c]){
									packetsNotFound.push(c)
								}
							}
							emitter.emit('message',{
								type: 'requestPacket',
								content: {
									id,
									numbers: packetsNotFound,
									t
								}
							})
						}
					},PACKET_DELAY_REQUEST)
				}
			}
		}
	})
}

const removePacket = (packets,closedPackets,idd) => {
	let where 
	packets.find(({id},i) => {
		if(id === id) {
			closedPackets.push(id)
			where = i
		}
	})
	packets.splice(where,1)
}

const getPacket = (packets,idd) => {
	return packets.find(({id}) => {
		return id === idd
	})
}

const send = (emitter, socket, data, username, password) => {
	const splitedData = encrypt(data,password).match(/.{1,1100}/g)
	const id = createHash('sha256')
		.update(splitedData[0])
		.digest().toString()
	emitter.on('requestPacket',({ id:idd, numbers,t }) => {
		if(idd === id){
			numbers.forEach(n => {
				sendPacket(splitedData[n],n,Array(t))
			})
		}
	})
	const sendPacket = (d,i,t) => {
		const packet = {
			i,
			t:t.length,
			d,
			id,
			username
		}
		socket.write(`${JSON.stringify(packet)}__`)
	}
	splitedData.map(sendPacket)
}

function entry(API){
	const { StatusBarItem, ContextMenu, Notification } = API
	new StatusBarItem({
		label: 'Remote',
		action(e){
			new ContextMenu({
				parent: e.target,
				list:[
					{
						label: 'Join',
						action: async function(){
							const { room, password, username } = await askForConfig(API) 
							const emitter = joinRoom(API, room, password, username)
							globalEmitter = emitter
							handleEvents(emitter,API)
							createSidePanel(emitter,API)
							new Notification({
								title: `Joined #${room} as ${username}`,
								content: ''
							})
						}
					},
					{
						label: 'Close',
						action: async function(){
							if(globalEmitter) globalEmitter.emit('disconnect')
						}
					}
				],
				event: e
			})
		}
	})
}

const sanitizePath = path => path.replace(/\\\\/gm,"\\")

function handleEvents(emitter,API){
	const { RunningConfig, Notification, puffin, ContextMenu } = API
	emitter.on('info', data => {
		console.log(data)
	})
	emitter.on('listFolder', async ({ folderPath }) => {
		fs.readdir(folderPath,(err, list)=>{
			const computedItems = list.map( item => {
				const directory = join(folderPath,item)
				return {
					name: item,
					isFolder: fs.lstatSync(directory).isDirectory()
				}
			})
			emitter.emit('message',{
				type: 'returnListFolder',
				content:{
					folderPath,
					folderItems: computedItems
				}
			})
		})
	})
	emitter.on('getFileContent', async ({ filePath }) => {
		fs.readFile(filePath,'UTF-8', (err, fileContent) => {
			if(!err){
				emitter.emit('message',{
					type: 'returnGetFileContent',
					content:{
						filePath,
						fileContent
					}
				})
			}
		})
	})
	RunningConfig.on('addFolderToRunningWorkspace', ({ folderPath }) => {
		emitter.emit('message',{
			type: 'openedFolder',
			content: {
				folderPath
			}
		})
	})
	emitter.on('userIdentified', async ({ username }) => {
		new Notification({
			title: `User ${username} just joined #${emitter.data.room}`,
			content: ''
		})
	})
	const cursorClass = puffin.style`
		& {
			border-left-style: solid;
			border-left-width: 1px;
			border-left-color: yellow;
			cursor:pointer;
			margin: 0;
			padding: 0;
		}
	`
	RunningConfig.on('aTabHasBeenCreated', ({ directory, client, instance }) => {
		let previousBookmark
		emitter.on('cursorSetIn', async ({ filePath, line, ch, senderUsername }) => {
			if( sanitizePath(directory) === sanitizePath(filePath) ){
				if(previousBookmark) previousBookmark.clear()
				const peerCursor = document.createElement('span');
				peerCursor.classList.add(cursorClass)
				let closeContext = null
				peerCursor.onmouseenter = event => {
					const { close } = new ContextMenu({
						list:[
							{
								label: senderUsername
							}
						],
						parent: document.body,
						event
					})
					closeContext = close
				}
				peerCursor.onmouseleave = event => {
					if(closeContext) {
						setTimeout(()=>{
							closeContext()
						},450)
					}
				}
				previousBookmark = client.do('setBookmark',{
					instance,
					line: line -1,
					ch: ch -1,
					element: peerCursor
				})
			}
		})
		emitter.on('contentModified', async ({ filePath, from, to, value }) => {
			if( sanitizePath(directory) === sanitizePath(filePath) ){
				client.do('replaceRange',{
					instance,
					from,
					to,
					text: value
				})
			}
		})
		let lastChange = null
		const handleChanges = (changeObj, client, instance, directory, emitter) => {
			if(lastChange != null){ // Avoid initial value
				if(JSON.stringify(lastChange) == JSON.stringify(changeObj) || changeObj.origin === "+move") return //Prevent propagation
			}
			const lineValue = client.do('getLine',{
				instance,
				line: changeObj.from.line
			})
			emitter.emit('message',{
				type: 'contentModified',
				content: {
					from:{
						line: changeObj.from.line,
						ch: 0
					},
					to:{
						line: changeObj.to.line,
						ch: 9999
					},
					value: lineValue,
					filePath: directory
				}
			})
			lastChange = changeObj
		}
		client.do('onChanged',{ instance, action: (data, changeObj) => handleChanges(changeObj, client, instance, directory, emitter)})
		client.do('onActive',{ instance, action: (data, changeObj) => handleCursor(emitter, client, instance, directory)})
	})
}

const handleCursor = (emitter, client, instance, directory) => {
	const { line, ch } = client.do('getCursorPosition',{
		instance
	})
	emitter.emit('message',{
		type: 'cursorSetIn',
		content:{
			filePath: directory,
			line,
			ch
		}
	})
}

const createSidePanel = (emitter,API) => {
	const { puffin, SidePanel, Explorer, RunningConfig } = API
	new SidePanel({
		icon(){
			return  puffin.element`
				<i>RC</i>
			`
		},
		panel(){
			function mounted(){
				emitter.on('userIdentified', ({ username }) => {
					function userMounted(){
						emitter.on('userDisconnected', ({ username: disconnectedUsername }) => {
							if( username === disconnectedUsername ){
								this.remove()
							}
						})
					}
					const user = new Explorer({
						items:[
							{
								label:  username,
								mounted: userMounted
							}
						]
					})
					puffin.render(user,this.querySelector("#users"))
				})
				emitter.on('openedFolder', async ({ folderPath }) => {
					let itemOpened = false
					const remoteExplorer = new Explorer({
						items:[
							{
								label: basename(folderPath),
								items: [],
								icon:'folder.closed',
								action: async function(e,{ setIcon, setItems }){
									if( !itemOpened ){
										const items = await getItemsInFolder(emitter,folderPath,API)
										setItems(items)
										setIcon('folder.opened')
									}else{
										setIcon('folder.closed')
									}
									itemOpened = !itemOpened
								}
							}
						]
					})
					puffin.render(remoteExplorer,this.querySelector("#projects"))
				})
			}
			const youUser = new Explorer({
				items:[
					{
						label:  emitter.data.me.username,
						decorator:{
							label: 'You',
							background: 'var(--buttonBackground)'
						}
					}
				]
			})
			return puffin.element`
				<div mounted="${mounted}">
					<div id="users">
						${youUser}
					</div>
					<div id="projects"/>
				</div>
			`
		}
	})
}

const getExtension = path => extname(path).split('.')[1]

const getItemsInFolder = async (emitter,folderPath,API) => {
	const { puffin, SidePanel, Explorer, RunningConfig, Editor, Tab } = API
	return new Promise((resolve, reject) => {
		emitter.emit('message',{
			type: 'listFolder',
			content: {
				folderPath
			}
		})
		emitter.on('returnListFolder',({ folderPath: returnedFolderPath, folderItems })=>{
			if( folderPath === returnedFolderPath ){
				let itemsList = []
				itemsList = folderItems.map(({ name, isFolder}) => {
					if(isFolder){
						let itemOpened = false
						const itemData = {
							label: name,
							icon: 'folder.closed',
							action: async function(e,{ setIcon, setItems }){
								if( isFolder ){
									if( !itemOpened) {
										const directory = join(folderPath,name)
										const items = await getItemsInFolder(emitter,directory,API)
										setItems(items)
										setIcon('folder.opened')
									}else{
										setIcon('folder.closed')
									}
								}
								itemOpened = !itemOpened
							},
							items:[]
						}
						return itemData
					}
				}).filter(Boolean)
				folderItems.map(({ name, isFolder }) => {
					if(!isFolder) {
						const directory = join(folderPath,name)
						const itemData = {
							label: name,
							icon: `${getExtension(directory)}.lang`,
							action: async function(e){
								if( !isFolder ){
									createTabEditor(directory, folderPath, emitter, API)
								}
							}
						}
						itemsList.push(itemData)
					}
				})
				resolve(itemsList)
			}
		})
	})
}

const createTabEditor = async (directory, folderPath, emitter, API) => {
	const { Editor, Tab } = API
	const { bodyElement, tabElement, tabState, isCancelled } = new Tab({
		isEditor: true,
		title: basename(directory),
		directory,
		parentFolder: folderPath
	})
	if (!isCancelled) {
		const { client, instance } = new Editor({
			language: getExtension(directory),
			value: await getFileContent(emitter,directory),
			theme: 'Night',
			bodyElement,
			tabElement,
			tabState,
			directory
		})
	}
}

const getFileContent = (emitter, filePath ) => {
	return new Promise((resolve, reject ) => {
		emitter.emit('message',{
			type: 'getFileContent',
			content:{
				filePath
			}
		})
		emitter.on('returnGetFileContent',({ filePath: returnFilePath, fileContent }) => {
			if( filePath === returnFilePath ){
				resolve(fileContent)
			}
		})
	})
}

const askForConfig = ({ puffin, Dialog, drac }) => {
	return new Promise((resolve, reject)=>{
		const dialog = new Dialog({
			title: 'Login',
			height: '270px',
			component(){
				const styleWrapper = puffin.style`
					& {
						display: flex;
						flex-direction: column;
					}
					& > div {
						display: flex;
						flex: 1;
					}
					& > div label {
						width: 120px;
						height: 100%;
						margin: auto 0;
					}
					& > div input {
						flex: 1;
						max-width: 60%;
					}
				`
				return puffin.element({
					components:{
						Input: drac.Input
					}
				})`
				<div class="${styleWrapper}">
					<div>
						<label>Room</label> 
						<Input placeHolder="CodeParty" id="room"/>
					</div>
					<div>
						<label>Username</label> 
						<Input placeHolder="Superman" id="username"/>
					</div>
					<div>
						<label>Password</label> 
						<Input type="password" id="password"/>
					</div>
				</div>
				`
			},
			buttons:[
				{
					label: 'Connect',
					action(){
						const room = document.getElementById('room').value || 'public'
						const username = document.getElementById('username').value 
						const password = document.getElementById('password').value.repeat(32).substring(0,32)
						resolve({
							room,
							username,
							password
						})
					}
				}
			]
		})
		dialog.launch()
	})
}


module.exports = { entry }