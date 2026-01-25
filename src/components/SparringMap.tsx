import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { SparringProfile } from '../types'
import { styleLabels, handLabels, formatWeight, formatExperience } from '../types'

interface SparringMapProps {
  profiles: SparringProfile[]
  onMarkerClick: (profile: SparringProfile) => void
  center?: [number, number]
  zoom?: number
  height?: string
}

// Кастомная иконка маркера в стиле палитры
const createMarkerIcon = (style: 'outside' | 'inside' | 'both') => {
  const colors: Record<string, string> = {
    outside: '#E63946', // primary-500 (красный)
    inside: '#FF4500',  // secondary-500 (оранжевый)
    both: '#4A90E2'     // info (синий)
  }
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${colors[style]};
        border: 3px solid #F1F2F3;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="color: white; font-size: 14px; font-weight: bold;">
          ${style === 'outside' ? '↗' : style === 'inside' ? '↘' : '⚡'}
        </span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20]
  })
}

export function SparringMap({
  profiles,
  onMarkerClick,
  center = [55.7558, 37.6173], // Москва по умолчанию
  zoom = 5,
  height = '100%'
}: SparringMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Инициализация карты
    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: true
    })

    // Тёмный стиль карты (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Обновление маркеров при изменении профилей
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Удаляем старые маркеры
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Добавляем новые маркеры
    profiles.forEach(profile => {
      const marker = L.marker([profile.latitude, profile.longitude], {
        icon: createMarkerIcon(profile.style)
      })

      // Попап с краткой информацией
      const popupContent = `
        <div style="
          font-family: system-ui, -apple-system, sans-serif;
          padding: 8px;
          min-width: 180px;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
          ">
            ${profile.photo_url 
              ? `<img src="${profile.photo_url}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />`
              : `<div style="width: 40px; height: 40px; border-radius: 50%; background: #3C4251; display: flex; align-items: center; justify-content: center; color: #F1F2F3; font-weight: bold;">${profile.first_name[0]}</div>`
            }
            <div>
              <div style="font-weight: 600; color: #F1F2F3;">
                ${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}
              </div>
              <div style="font-size: 12px; color: #7A8E99;">
                @${profile.telegram_username}
              </div>
            </div>
          </div>
          
          <div style="font-size: 12px; color: #B5BFC4; margin-bottom: 8px;">
            ${profile.weight_kg ? formatWeight(profile.weight_kg) : 'Вес не указан'} · 
            ${handLabels[profile.hand]} · 
            ${formatExperience(profile.experience_years)}
          </div>
          
          <div style="
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
            background: ${profile.style === 'outside' ? '#E63946' : profile.style === 'inside' ? '#FF4500' : '#4A90E2'};
            color: white;
          ">
            ${styleLabels[profile.style].name}
          </div>
          
          <button 
            onclick="window.openSparringProfile('${profile.id}')"
            style="
              display: block;
              width: 100%;
              margin-top: 10px;
              padding: 8px;
              background: #E63946;
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 13px;
              font-weight: 500;
              cursor: pointer;
            "
          >
            Открыть профиль
          </button>
        </div>
      `

      marker.bindPopup(popupContent, {
        className: 'dark-popup'
      })

      marker.on('click', () => {
        // При клике открываем попап, но также можем вызвать callback
      })

      marker.addTo(map)
      markersRef.current.push(marker)
    })

    // Глобальная функция для кнопки в попапе
    ;(window as any).openSparringProfile = (id: string) => {
      const profile = profiles.find(p => p.id === id)
      if (profile) {
        onMarkerClick(profile)
      }
    }

    // Если есть профили, подстраиваем границы карты
    if (profiles.length > 0) {
      const bounds = L.latLngBounds(profiles.map(p => [p.latitude, p.longitude]))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 })
    }
  }, [profiles, onMarkerClick])

  return (
    <>
      <style>{`
        .dark-popup .leaflet-popup-content-wrapper {
          background: #161415;
          color: #F1F2F3;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .dark-popup .leaflet-popup-tip {
          background: #161415;
        }
        .dark-popup .leaflet-popup-close-button {
          color: #7A8E99 !important;
        }
        .dark-popup .leaflet-popup-close-button:hover {
          color: #E63946 !important;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
      <div 
        ref={mapRef} 
        style={{ 
          height, 
          width: '100%',
          borderRadius: '12px',
          overflow: 'hidden'
        }} 
      />
    </>
  )
}
