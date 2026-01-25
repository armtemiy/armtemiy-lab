from aiogram.fsm.state import StatesGroup, State

class AdminStates(StatesGroup):
    waiting_for_broadcast_text = State()
