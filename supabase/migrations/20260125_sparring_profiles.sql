-- Sparring Profiles для Armtemiy Lab v2.0
-- Поиск спарринг-партнёров

-- Таблица sparring_profiles
create table if not exists public.sparring_profiles (
  id uuid primary key default gen_random_uuid(),
  
  -- Связь с пользователем
  user_id uuid references public.users(id) on delete cascade,
  telegram_user_id text not null,
  telegram_username text not null,
  
  -- Имя
  first_name text not null,
  last_name text,
  
  -- Геолокация
  location_type text not null default 'manual', -- 'geo' | 'manual'
  city text,
  district text,
  latitude float not null,
  longitude float not null,
  
  -- Вес (хранится в кг, конвертируется при отображении)
  weight_kg float,
  
  -- Рука
  hand text not null default 'right', -- 'left' | 'right' | 'both'
  
  -- Стаж в годах (дробное число, например 2.5)
  experience_years float default 0,
  
  -- Стиль борьбы
  style text not null default 'outside', -- 'outside' | 'inside' | 'both'
  
  -- О себе
  bio text,
  
  -- Фото
  photo_source text default 'telegram', -- 'telegram' | 'custom'
  photo_url text,
  
  -- Статус
  is_active boolean default true,
  
  -- Временные метки
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Индексы для быстрого поиска
create index if not exists idx_sparring_profiles_location 
  on public.sparring_profiles(latitude, longitude);

create index if not exists idx_sparring_profiles_telegram_user_id 
  on public.sparring_profiles(telegram_user_id);

create index if not exists idx_sparring_profiles_is_active 
  on public.sparring_profiles(is_active);

-- Уникальный профиль на пользователя
create unique index if not exists idx_sparring_profiles_user_unique 
  on public.sparring_profiles(telegram_user_id);

-- RLS пока выключен для MVP
alter table public.sparring_profiles disable row level security;

-- Триггер для обновления updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_sparring_profiles_updated_at on public.sparring_profiles;
create trigger update_sparring_profiles_updated_at
  before update on public.sparring_profiles
  for each row
  execute function update_updated_at_column();

-- Комментарии
comment on table public.sparring_profiles is 'Профили для поиска спарринг-партнёров';
comment on column public.sparring_profiles.location_type is 'Тип определения локации: geo (геолокация) или manual (ввод вручную)';
comment on column public.sparring_profiles.weight_kg is 'Вес в килограммах (конвертируется в фунты при отображении)';
comment on column public.sparring_profiles.experience_years is 'Стаж занятий армрестлингом в годах';
comment on column public.sparring_profiles.style is 'Стиль борьбы: outside (аутсайд/верх/клюшка) или inside (инсайд/крюк/пресс)';
comment on column public.sparring_profiles.photo_source is 'Источник фото: telegram (из аватара) или custom (загруженное)';
