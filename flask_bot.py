import os
import requests
from flask import Flask, request

app = Flask(__name__)

BOT_TOKEN = "8927030113:AAEL8Esl0fdGuXWltE253EGEB5vQZr9oifc"
CHANNEL_USERNAME = "@lifevoloshin"
CHANNEL_LINK = "https://t.me/lifevoloshin"
WEBAPP_URL = "https://m931mm.github.io/my-workflow-app/"
TELEGRAM_API = f"https://api.telegram.org/bot{BOT_TOKEN}"

def check_subscription(user_id):
    try:
        res = requests.get(f"{TELEGRAM_API}/getChatMember", params={"chat_id": CHANNEL_USERNAME, "user_id": user_id}).json()
        if res.get("ok"):
            status = res["result"].get("status")
            return status in ["member", "administrator", "creator"]
    except Exception as e:
        print(f"Error checking sub: {e}")
    return False

@app.route('/', methods=['POST', 'GET'])
def webhook():
    if request.method == 'GET':
        return "My Workflow Bot is Active 24/7!", 200

    update = request.get_json(force=True, silent=True)
    if not update:
        return "OK", 200

    if "message" in update:
        msg = update["message"]
        chat_id = msg["chat"]["id"]
        user_id = msg["from"]["id"]
        text = msg.get("text", "")

        if text.startswith("/start"):
            if check_subscription(user_id):
                send_app_button(chat_id)
            else:
                send_sub_button(chat_id)

    elif "callback_query" in update:
        cb = update["callback_query"]
        cb_id = cb["id"]
        chat_id = cb["message"]["chat"]["id"]
        user_id = cb["from"]["id"]
        data = cb.get("data", "")

        if data == "check_sub":
            if check_subscription(user_id):
                answer_callback(cb_id, "🎉 Подписка подтверждена!")
                send_app_button(chat_id)
            else:
                answer_callback(cb_id, "❌ Подписка не найдена! Подпишитесь на @lifevoloshin", show_alert=True)

    return "OK", 200

def send_app_button(chat_id):
    payload = {
        "chat_id": chat_id,
        "text": "✅ <b>Подписка на канал @lifevoloshin подтверждена!</b>\n\nНажмите кнопку ниже, чтобы открыть приложение <b>My Workflow</b> прямо внутри Telegram:",
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": [
                [{"text": "🚀 Открыть My Workflow", "web_app": {"url": WEBAPP_URL}}],
                [{"text": "📢 Наш канал @lifevoloshin", "url": CHANNEL_LINK}]
            ]
        }
    }
    requests.post(f"{TELEGRAM_API}/sendMessage", json=payload)

def send_sub_button(chat_id):
    payload = {
        "chat_id": chat_id,
        "text": "❌ <b>Доступ ограничен!</b>\n\nДля использования приложения <b>My Workflow</b> необходимо подписаться на наш канал @lifevoloshin.\n\n1. Нажмите кнопку «Подписаться» ниже.\n2. После подписки нажмите «Я подписался (Проверить)».",
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": [
                [{"text": "📢 Подписаться на @lifevoloshin", "url": CHANNEL_LINK}],
                [{"text": "🔄 Я подписался (Проверить)", "callback_data": "check_sub"}]
            ]
        }
    }
    requests.post(f"{TELEGRAM_API}/sendMessage", json=payload)

def answer_callback(cb_id, text, show_alert=False):
    requests.post(f"{TELEGRAM_API}/answerCallbackQuery", json={
        "callback_query_id": cb_id,
        "text": text,
        "show_alert": show_alert
    })
