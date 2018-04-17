let eris = require("eris");
let fs = require('fs')
let path = require("path")
let http = require('http')
let https = require('https')

let config = require("./config.json");

let bot = new eris.Client(config.token);

let prefix = "knuckles";

let commands = {};

let permissions = require("./permissions.json");
let listenings = require("./submissions.json");

function add(co) {
    if (!commands[co.name]) {
        commands[co.name] = {
            func: co.func,
            perm: co.perm != undefined ? co.perm : 3
        };
    }
}
bot.on("ready", () => {
    console.log("loaded");
});
bot.on("messageCreate", m => {
    parse(m);
});

async function parse(message) {
    if(message.author.bot) return;
    let c = message.content;
    if (c.toLowerCase().startsWith(prefix) || c.startsWith("<@309426597784715285>")) {
        if (!permissions[message.author.id]) {
            permissions[message.author.id] = 0;
            fs.writeFileSync("permissions.json", JSON.stringify(permissions));
        }
        let ca = c.slice(prefix.length, c.length).split(" ");
        if (ca[0] == "") ca = ca.slice(1, ca.length);
        let com = ca[0];
        //console.log(com)
        //console.log(commands[com])
        if (commands[com]) {
            if (permissions[message.author.id] >= commands[com].perm) {
                let args = ca.slice(1, ca.length).join(" ");
                console.log(
                    "ran " +
                    com +
                    " | " +
                    args +
                    " (" +
                    message.author.id +
                    " > " +
                    message.author.username +
                    ")"
                );
                commands[com].func(message, args);
            } else {
                await sendImage(message);
            }
        } else {
            await sendImage(message);
        }
    } else if (c.toLowerCase().includes(prefix) || c.includes("<@309426597784715285>")) {
        await sendImage(message);
    }
}

async function sendImage(message) {
    let dir = fs.readdirSync(path.join(__dirname, "images"))
    console.log(dir)
    let n = Math.floor(Math.random() * (dir.length))
    if(n = dir.length) n = dir.length - 1
    let p = path.join(__dirname, "images", dir[n])
    console.log(n, p)
    message.channel.createMessage("" , {file: fs.readFileSync(p), name: "knuckles.png"})
}

function findLink(string) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return string.match(urlRegex);
}

async function downloadImage(url, path, callback) {
    try {
        let file = fs.createWriteStream(path);
        let req = https.get(url, (r)=>{
            r.pipe(file)
        }).catch(()=>{

        })
        file.on("finish", ()=>{
            file.close(callback)
        })
    }
    catch (e) {
        fs.unlink(path);
        console.error(e)
    }
}

bot.connect();
add({
    name: "ping",
    func: function (msg, args) {
        msg.channel.createMessage("Pong.").then(m => {
            let output = (m.timestamp - msg.timestamp) * 1000;
            m.edit("Pong, took `" + output + "μs`");
        });
    },
    perm: 0
});
add({
    name: "restart",
    func: function (msg, args) {
        process.exit();
    }
});
add({
    name: "eval",
    func: function (msg, args, data) {
        let opt;
        if (args.includes("bot.token")) args = "\"AAAAAAAAAAAAAAAAAAAAAAAA.AAAAAA._AAAAAAAAAAAAAAAAAAAAAAAAAB\""
        try {
            opt = eval(args)
        } catch (e) {
            opt = "!! ERROR !! " + e
        }
        if (opt == "" && typeof opt == String) {
            opt = "no output..."
        } else if (opt == undefined) {
            opt = 'undefined'
        } else if (opt == "") {
            opt = opt + ""
        }
        msg.channel.createMessage("returns: " + opt)
    }
})
add({
    name: "submit",
    func: function(msg, args) {
        if(findLink(args)) {
            let links = findLink(args);
            if(links.length > 0) {
                for (l in links) {
                    let dir = fs.readdirSync(path.join(__dirname, "submissions"))
                    let latest = dir[dir.length - 1];
                    let newName = ((parseInt(latest) ? parseInt(latest) : 0) + 1) + ".png";
                    downloadImage(links[l], path.join(__dirname, "submissions", newName),function(info){
                        msg.channel.createMessage("image submitted")
                    });
                }
            }
        }
        if(msg.attachments.length > 0) {
            for(m in msg.attachments) {
                let dir = fs.readdirSync(path.join(__dirname, "submissions"))
                let latest = dir[dir.length - 1];
                let newName = ((parseInt(latest) ? parseInt(latest) : 0) + 1) + ".png";
                downloadImage(msg.attachments[m].url, path.join(__dirname, "submissions", newName), function(info){
                    msg.channel.createMessage("image submitted")
                });
            }  
        }
    },
    perm: 1
})
add({
    name: "accept",
    func: function(msg, args) {
        let dir = fs.readdirSync(path.join(__dirname, "images"))
        let latest = dir[dir.length - 1];
        let newName = ((parseInt(latest) ? parseInt(latest) : 0) + 1) + ".png";
        let sdir = fs.readdirSync(path.join(__dirname, "submissions"))
        if(fs.existsSync(path.join(__dirname, "submissions", args + ".png"))) {
            console.log(path.join(__dirname, "images", newName));
            fs.renameSync(path.join(__dirname, "submissions", args + ".png"), path.join(__dirname, "images", newName))
        }
        else {
            msg.channel.createMessage("non-existant, " + args + ".png [" + sdir + "]")
        }
    },
    perm: 3
})