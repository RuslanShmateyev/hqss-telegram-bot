const db = require('../services/database');
const bot = require('../services/telegram');
const axios = require('axios');

function useBitrixMethod(method, body) {//auxiliary function for requests to bitrix
    return axios.post(`${process.env.BITRIXURL}/${method}`, body);
}

module.exports= {
    checkUser: db.checkUser,
    tryToAddUser: async function (phone, chat_id) {//find user in bitrix and add to db 
        const { data } = await useBitrixMethod('crm.contact.list', {
            filter: {
                PHONE: phone
            },
            select: ['ID']
        });
        if (data.result.length === 0) return false;

        db.addUser(phone, chat_id);
        return true;
    },
    checkProject: async function (group_title) {//check project in bitrix
        const { data } = await useBitrixMethod('sonet_group.get', {
            FILTER: {
                PROJECT: 'Y'
            },
            select: ['ID']
        });

        for (const project of data.result) {
            return project.DESCRIPTION.trim() === group_title;
        }
    },
    getProject: async function (group_title) {//get project from bitrix
        const { data } = await useBitrixMethod('sonet_group.get', {
            FILTER: {
                PROJECT: 'Y'
            },
            select: ['ID']
        });

        for (const project of data.result) {
            if (project.DESCRIPTION.trim() === group_title) {
                return project.ID;
            }
        }
    },
    checkNotStartedTask: async function (project_id, name) {//check if in bitrix we already have not started task
        const { data } = await useBitrixMethod('tasks.task.list', {
            filter: {
                GROUP_ID: project_id,
                STATUS: 2
            },
            select: ['ID']
        });        

        for (const task of data.result.tasks) {
            if (task.TITLE.includes(name)) {
                return true;
            }
        }

        return false;
    },
    createTask: async function (project_id, group_title, text, name) {//create task in bitrix
        await useBitrixMethod('tasks.task.add', {
            fields: {
                GROUP_ID: project_id,
                TITLE: `Телеграм: ${group_title}, сообщение от: ${name}...`,
                DESCRIPTION: text,
                RESPONSIBLE_ID: process.env.RESPONSIBLE_ID,
            }
        });

        return true;
    },
    sendAlertToAdmin: async function (group_title) {//send alert in telegram to admin
        bot.telegram.sendMessage(process.env.ADMIN_CHAT_ID, 
            `Бот был добавлен вами в группу: ${group_title}. При этом проекта соответсвующего данной группе нет. \nПожалуйста добавьте в описание соотвествующего проекта название этой группы (${group_title}).`
        ); //send alert to admin that project in Bitrix was not found
    }
}