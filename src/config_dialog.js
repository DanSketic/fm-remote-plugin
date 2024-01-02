import translate from "../i18n.js";

const configDialog = ({ puffin, Window, SideMenu, drac, StaticConfig }) => {
	return new Promise((resolve, reject) => {
		const configWindow = new Window({
			width: '550px',
			height: '450px',
			component() {
				const styleWrapper = puffin.style`
					& > * {
						display: block;
						margin: 10px 0px;
					}
				`

				function connectFromCode() {
					const username = document.getElementById('username_code').value
					const code = document.getElementById('code_code').value.split('##')

					const room = code[0]
					const password = code[1]

					resolve({
						room,
						username,
						password
					})
					configWindow.close()
				}

				function connectRandomly() {
					const username = document.getElementById('username_random').value
					const room = (Math.random() * 100).toString().slice(0, 5) + username.slice(0, 6)
					// PW upgrade to 32 chars
					const password = Math.random().toString().repeat(32).substring(0, 32)
					resolve({
						room,
						username,
						password
					})
					configWindow.close()
				}

				function connectManually() {
					const room = document.getElementById('room_manually').value || 'public'
					const username = document.getElementById('username_manually').value
					// PW upgrade to 32 chars
					const password = document.getElementById('password_manually').value.repeat(32).substring(0, 32)
					resolve({
						room,
						username,
						password
					})
					configWindow.close()
				}


				return puffin.element({
					components: {
						SideMenu,
						Input: drac.Input,
						Button: drac.Button
					}
				})`
				<SideMenu default="normal">
					<div>
						<h1>${translate("remote", StaticConfig.data.appLanguage)}</h1>
						<label to="normal">${translate("normal", StaticConfig.data.appLanguage)}</label>
						<label to="code">${translate("with_code", StaticConfig.data.appLanguage)}</label>
						<label to="random">${translate("random", StaticConfig.data.appLanguage)}</label>
					</div>
					<div>
						<div href="normal" class="${styleWrapper}">
							<label>${translate("room", StaticConfig.data.appLanguage)}</label> 
							<Input placeHolder="${translate("accparty", StaticConfig.data.appLanguage)}" id="room_manually"/>
							<label>${translate("username", StaticConfig.data.appLanguage)}</label> 
							<Input placeHolder="${translate("username", StaticConfig.data.appLanguage)}" id="username_manually"/>
							<label>${translate("password", StaticConfig.data.appLanguage)}</label> 
							<Input type="password" placeHolder="${translate("pw_ph", StaticConfig.data.appLanguage)}" id="password_manually"/>
							<Button :click="${connectManually}">${translate("connect", StaticConfig.data.appLanguage)}</Button>
						</div>
						<div href="code" class="${styleWrapper}">
							<label>${translate("code", StaticConfig.data.appLanguage)}</label> 
							<Input placeHolder="${translate("code_ph", StaticConfig.data.appLanguage)}" id="code_code"/>
							<label>${translate("username", StaticConfig.data.appLanguage)}</label> 
							<Input placeHolder="${translate("xyz", StaticConfig.data.appLanguage)}" id="username_code"/>
							<Button :click="${connectFromCode}">${translate("connect", StaticConfig.data.appLanguage)}</Button>
						</div>
						<div href="random" class="${styleWrapper}">
							<label>${translate("your_name", StaticConfig.data.appLanguage)}</label> 
							<Input placeHolder="${translate("xyz", StaticConfig.data.appLanguage)}" id="username_random"/>
							<Button :click="${connectRandomly}">${translate("connect", StaticConfig.data.appLanguage)}</Button>
						</div>
					</div>
				</SideMenu>
				`
			}
		})
		configWindow.launch()
	})
}

export default configDialog