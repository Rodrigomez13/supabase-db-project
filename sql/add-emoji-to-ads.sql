-- Agregar campo emoji a la tabla ads
ALTER TABLE ads ADD COLUMN IF NOT EXISTS emoji TEXT;

-- Crear índice para búsquedas rápidas por emoji
CREATE INDEX IF NOT EXISTS ads_emoji_idx ON ads(emoji);

-- Comentario para la columna
COMMENT ON COLUMN ads.emoji IS 'Emoji identificador para el anuncio, usado por el bot de publicidad';
