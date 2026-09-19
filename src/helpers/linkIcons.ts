import defIcon from '../pages/get-qr/icons/def.svg'
import tgIcon from '../pages/get-qr/icons/tg.svg'
import avitoIcon from '../pages/get-qr/icons/avito.png'
import gisIcon from '../pages/get-qr/icons/gis.svg'
import vkIcon from '../pages/get-qr/icons/vk.svg'
import maxIcon from '../pages/get-qr/icons/max.svg'
import waIcon from '../pages/get-qr/icons/wa.svg'
import yaIcon from '../pages/get-qr/icons/ya.svg'

const ICONS: Record<string, string> = {
    'tg.svg': tgIcon,
    'ya.svg': yaIcon,
    'gis.svg': gisIcon,
    'vk.svg': vkIcon,
    'max.svg': maxIcon,
    'wa.svg': waIcon,
    'avito.png': avitoIcon,
}

export const resolveIcon = (path: string | null | undefined): string => {
    if (!path) return defIcon
    return ICONS[path.split('/').pop() ?? ''] ?? defIcon
}
