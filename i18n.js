export const strings = {
	remote: {
		english: "Remote",
		german: "Fernbedienung",
		hungarian: "Összekapcsol"
	},
	join: {
		english: "Join",
		german: "Verbinden",
		hungarian: "Belépés"
	},
	joined: {
		english: "Joined",
		german: "Beigetreten",
		hungarian: "Bejelentkezve"
	},
	disconnect: {
		english: "Disconnect",
		german: "Trennen",
		hungarian: "Kapcsolat bontasa"
	},
	you: {
		english: "You",
		german: "Du",
		hungarian: "Te"
	},
	users: {
		english: "Users",
		german: "Benutzer",
		hungarian: "Felhasználók"
	},
	folders: {
		english: "Folders",
		german: "Ordner",
		hungarian: "Mappak"
	},
	rooms_code: {
		english: "Room's Code",
		german: "Raumcode",
		hungarian: "Szoba kódja"
	},
	not_created_or_joined_room: {
		english: "You have not created or joined any rooms yet",
		german: "Sie haben noch keine Räume erstellt oder sind diesen beigetreten",
		hungarian: "Még nem hozott létre szobát, és nem csatlakozott hozzájuk"
	},
	share_room: {
		english: "SHARE ROOM",
		german: "RAUM TEILEN",
		hungarian: "SZOBA MEGOSZTÁSA"
	},
	time: {
		english: "TIME",
		german: "ZEIT",
		hungarian: "IDŐ"
	},
	none: {
		english: "None",
		german: "Keine",
		hungarian: "Nincs"
	},
	joined_to_room: {
		english: "Joined to room",
		german: "Beigetreten in einem Raum",
		hungarian: "Bejelentkett a szobába"
	},
	normal: {
		english: "Normal",
		german: "Normal",
		hungarian: "Normál"
	},
	with_code: {
		english: "With code",
		german: "Mit Code",
		hungarian: "Kóddal"
	},
	random: {
		english: "Random",
		german: "Zufall",
		hungarian: "Véletlen"
	},
	room: {
		english: "Room",
		german: "Raum",
		hungarian: "Szoba"
	},
	username: {
		english: "Username",
		german: "Benutzername",
		hungarian: "Felhasználónév"
	},
	accparty: {
		english: "AccParty",
		german: "AccParty",
		hungarian: "AccParti"
	},
	xyz: {
		english: "XYZ",
		german: "XYZ",
		hungarian: "XYZ"
	},
	password: {
		english: "Password",
		german: "Passwort",
		hungarian: "Jelszó"
	},
	pw_ph: {
		english: "******",
		german: "******",
		hungarian: "******"
	},
	connect: {
		english: "Connect",
		german: "Verbinden",
		hungarian: "Csatlakozás"
	},
	code: {
		english: "Code",
		german: "Code",
		hungarian: "Kód"
	},
	code_ph: {
		english: "Party##Supersecret",
		german: "Party##Supergeheim",
		hungarian: "Parti##Szupertitkos"
	},
	your_name: {
		english: "Your name",
		german: "Dein Name",
		hungarian: "A neved"
	}
};

export default function translate(text, language) {
	const string = strings[text][language];
	if (!string) return strings[text].english;
	return string;
}