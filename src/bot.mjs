import {Bot, InlineKeyboard, Context} from "grammy/web";

const types = [
    ["Photo", "Sticker"],
    ["Video", "Audio"],
    ["VideoNote", "Voice"],
    ["Animation", "Document"],
];

const {TELEGRAM_BOT_TOKEN} = process.env;

export const bot = new Bot(TELEGRAM_BOT_TOKEN);

const getEntityURL = ({text, url}) => url || text;

const handleError = ctx => error => {
    const {message_id: reply_to_message_id} = ctx.msg;
    return ctx.reply(error.message || error.name, {reply_to_message_id});
}

const getKeyboardButtons = (rows = [[]]) => {
    return rows.map(row => row.map(text => ({text, callback_data: text})));
}

const handleCallback = type => ctx => {
    const method = `replyWith${type}`;
    if (!ctx[method]) return;
    const message = ctx.msg.reply_to_message;
    const {message_id: reply_to_message_id} = message;
    const context = new Context({...ctx.update, message}, ctx.api, ctx.me);
    const urls = context.entities(["url", "text_link"]).map(getEntityURL);
    return Promise.all(urls.map(url => ctx[method](url, {reply_to_message_id}).catch(handleError(ctx))));
}

bot.on("message:text", async ctx => {
    const {length} = ctx.entities(["url", "text_link"]);
    const {message_id: reply_to_message_id} = ctx.msg;
    if (!length) return ctx.reply(`Send any URL`);
    const reply_markup = new InlineKeyboard(getKeyboardButtons(types));
    return ctx.reply(`Select type for this URL:`, {reply_markup, reply_to_message_id});
});

types.flat().forEach(type => bot.callbackQuery(type, handleCallback(type)));

export default bot;
