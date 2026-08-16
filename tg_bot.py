#!/usr/bin/env python3
import os
import sys
import asyncio
from aiogram import Bot, Dispatcher, F, types
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo, CallbackQuery

# Configuration
CHANNEL_USERNAME = "@lifevoloshin"
CHANNEL_LINK = "https://t.me/lifevoloshin"

# WebApp URL (Default local test server or hosted URL)
WEBAPP_URL_FILE = os.path.join(os.path.dirname(__file__), "webapp_url.txt")

def get_webapp_url():
    if os.getenv("WEBAPP_URL"):
        return os.getenv("WEBAPP_URL").strip()
    if os.path.exists(WEBAPP_URL_FILE):
        with open(WEBAPP_URL_FILE, "r") as f:
            content = f.read().strip()
            if content:
                return content
    return "http://localhost:8085"

WEBAPP_URL = get_webapp_url()

# Token file or ENV
TOKEN_FILE = os.path.join(os.path.dirname(__file__), "bot_token.txt")

def get_token():
    if os.getenv("BOT_TOKEN"):
        return os.getenv("BOT_TOKEN").strip()
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "r") as f:
            return f.read().strip()
    return None

async def check_subscription(bot: Bot, user_id: int) -> bool:
    try:
        member = await bot.get_chat_member(chat_id=CHANNEL_USERNAME, user_id=user_id)
        return member.status in ["member", "administrator", "creator"]
    except Exception as e:
        print(f"Check sub error for {user_id}: {e}")
        return False

def get_sub_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📢 Подписаться на @lifevoloshin", url=CHANNEL_LINK)],
        [InlineKeyboardButton(text="🔄 Я подписался (Проверить)", callback_data="check_sub")]
    ])

def get_app_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🚀 Открыть My Workflow", web_app=WebAppInfo(url=WEBAPP_URL))],
        [InlineKeyboardButton(text="📢 Наш канал @lifevoloshin", url=CHANNEL_LINK)]
    ])

from aiogram.client.session.aiohttp import AiohttpSession

async def main():
    token = get_token()
    if not token or token == "YOUR_TELEGRAM_BOT_TOKEN":
        print(f"Error: Token not found! Please paste your token from @BotFather into {TOKEN_FILE} or BOT_TOKEN env var.")
        sys.exit(1)

    proxy = os.getenv("HTTP_PROXY") or os.getenv("http_proxy") or os.getenv("HTTPS_PROXY") or os.getenv("https_proxy")
    if not proxy and os.path.exists("/home/voleco"):
        proxy = "http://proxy.server:3128"

    if proxy:
        print(f"Using proxy: {proxy}")
        session = AiohttpSession(proxy=proxy)
        bot = Bot(token=token, session=session)
    else:
        bot = Bot(token=token)

    dp = Dispatcher()

    @dp.message(CommandStart())
    async def cmd_start(message: types.Message):
        user_id = message.from_user.id
        is_subbed = await check_subscription(bot, user_id)

        if is_subbed:
            await message.answer(
                f"✅ <b>Подписка на канал {CHANNEL_USERNAME} подтверждена!</b>\n\n"
                f"Нажмите кнопку ниже, чтобы открыть приложение <b>My Workflow</b> прямо внутри Telegram:",
                reply_markup=get_app_keyboard(),
                parse_mode="HTML"
            )
        else:
            await message.answer(
                f"❌ <b>Доступ ограничен!</b>\n\n"
                f"Для использования приложения <b>My Workflow</b> необходимо подписаться на наш канал {CHANNEL_USERNAME}.\n\n"
                f"1. Нажмите кнопку «Подписаться» ниже.\n"
                f"2. После подписки нажмите «Я подписался (Проверить)».",
                reply_markup=get_sub_keyboard(),
                parse_mode="HTML"
            )

    @dp.callback_query(F.data == "check_sub")
    async def cb_check_sub(callback: CallbackQuery):
        user_id = callback.from_user.id
        is_subbed = await check_subscription(bot, user_id)

        if is_subbed:
            await callback.message.edit_text(
                f"🎉 <b>Отлично! Подписка подтверждена!</b>\n\n"
                f"Нажмите кнопку ниже для запуска <b>My Workflow</b>:",
                reply_markup=get_app_keyboard(),
                parse_mode="HTML"
            )
        else:
            await callback.answer("❌ Подписка пока не найдена. Нажмите 'Подписаться на @lifevoloshin' и повторите попытку!", show_alert=True)

    print(f"Bot started successfully! Checking channel {CHANNEL_USERNAME}...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
