import { StoreStyleProps, normalizePageStyle } from "./link-row"
import { DefaultStyle } from "./default-style"
import { CoverStyle } from "./cover-style"
import '../style.css'

export const StoreStyle = (props: StoreStyleProps) =>
    normalizePageStyle(props.data.style) === 'cover'
        ? <CoverStyle {...props} />
        : <DefaultStyle {...props} />
