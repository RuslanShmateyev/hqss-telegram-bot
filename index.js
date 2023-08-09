require('dotenv').config({ path: `./config/${process.env.NODE_ENV}` })

const bot = require('./services/telegram');
const getPhoneMarkup = require(`./get_phone_markup.json`); //markup for phones

const { checkUser, tryToAddUser, checkProject, sendAlertToAdmin, getProject, checkNotStartedTask, createTask } = require('./services/sec_functions'); //import all required functions

bot.start((ctx) => {
    const chat = ctx.message.chat
    console.log('start');
    console.log(chat);
    console.log(ctx.message.from);
    
    if (chat.type === 'private'){ //bot cant send phone request in groups
        ctx.reply(process.env.START_TEXT, getPhoneMarkup);
    } else { //so if the user writes /start in group we ask him to go to a private chat
        ctx.reply(`Если вы хотите зарегистрироватся, пожалуйста напишите этому боту лично.`);
    }
});

bot.on('text', async (ctx) => {
    const { chat, from } = ctx.message;
    const group_title = chat.title;
    console.log('text');
    console.log(chat);

    if (chat.type === 'private') {

        if (checkUser(chat.id)) { //check if user is bitrix employee
            ctx.reply('Вы уже зарегистрированы!'); //user already registered
        }    
        else {
            ctx.reply('Если вы хотите зарегестрироватся, пожалуйста введите команду /start'); //user not registered
        }

    } else if (await checkProject(group_title)) {
        const project_id = await getProject(group_title);
        console.log(`project id: ${project_id}`);

        if (!await checkNotStartedTask(project_id, from.first_name)) {//we meed to check if there is no task with client name in project
            createTask(project_id, from.first_name); //create a new task if it does not exist
        }
    } else {
        //ignore message if group has not project in Bitrix
    }
});

bot.on('group_chat_created', async (ctx) => {
    const group_title = ctx.message.chat.title;
    console.log('group creating');
    console.log(ctx.message.chat);
    console.log(ctx.message.from);

    if (!await checkProject(group_title)) {
        sendAlertToAdmin(group_title);//if group was not found in bitrix send alert
    }
});

bot.on('new_chat_members', (ctx) => {
    const { chat, from, new_chat_members } = ctx.message;
    const group_title = chat.title;
    console.log('new chat member');
    console.log(chat);
    console.log(from);

    if (from.id != process.env.ADMIN_CHAT_ID) return false; //leave if not admin add

    if (chat.type !== 'group') return false; //leave if its not group

    new_chat_members.forEach(async element => { //searching if bot was added in group
        console.log(element);
        if (element.id == process.env.BOT_ID) { //do only if bot was added
            if (!await checkProject(group_title)) {
                sendAlertToAdmin(group_title);
            }
        }
    });
});

bot.on('message', async (ctx) => {
    if (ctx.message.contact === undefined) return false; //leave if its not phone number

    const rawPhone = ctx.message.contact.phone_number;
    const phone = rawPhone.slice(0, 1) === '+' ? rawPhone : '+' + rawPhone; //get phone with + in start

    if (await tryToAddUser(phone)) { //log user as bitrix exmployee
        ctx.reply('Вы успешно зарегистрированы!'); //user success authorization
    } else {
        ctx.reply('Вы не прошли авторизацию. Прошу проверьте, свой телефон в битриксе.'); //user failed authorization
    }
});

bot.launch();