import translate from "../../i18n.js";

const userJoined = ({
	room,
	username,
	Notification
}) => {
	new Notification({
		title: `${username} ${translate("joined_to_room", StaticConfig.data.appLanguage)} #${room}`,
		content: ''
	})
}

export default userJoined
