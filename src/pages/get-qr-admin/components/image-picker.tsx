import { useEffect, useState } from "react"
import { Text } from "../../../components"

interface ImagePickerProps {
    file: File | null;
    fallbackSrc: string | null;
    onChange: (file: File | null) => void;
    shape?: 'circle' | 'square';
    size?: number;
    label?: string;
}

export const ImagePicker = ({file, fallbackSrc, onChange, shape = 'circle', size = 96, label = 'Изменить'}: ImagePickerProps) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    useEffect(() => {
        if (!file) {
            setPreviewUrl(null)
            return
        }
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
        return () => URL.revokeObjectURL(url)
    }, [file])

    const src = previewUrl ?? fallbackSrc

    return (
        <label className={`image-picker image-picker-${shape}`} style={{width: size, height: size}}>
            <input
                type="file"
                accept="image/*"
                className="image-picker-input"
                onChange={(e) => onChange(e.target.files?.[0] ?? null)}
            />
            {src ? (
                <img className="image-picker-preview" src={src} alt="" />
            ) : (
                <span className="image-picker-plus">+</span>
            )}
            <span className="image-picker-overlay">
                <Text size="xs" color="white">{label}</Text>
            </span>
        </label>
    )
}
