import { Box, Typography } from '@material-ui/core'
import { BoxProps, Button, ButtonProps, styled, TypographyProps } from '@mui/material'
interface Props {
    // handleEvent: React.MouseEventHandler<HTMLElement>
    title: string
    bg: string
    color: string
    pasive?: boolean
    widthx?: string
    heightx?: string
    fontSizee?: string
}
const EstadoPill: React.FC<Props> = ({ title, pasive, bg, color, widthx, heightx, fontSizee }) => {
    const PillColor = styled(Box)<BoxProps>(({ theme }) => ({
        // width: '72px',
        // height: '24px',
        // width: '180px',
        // height: '26px',
        width: widthx,
        height: heightx,
        background: bg,
        borderRadius: '20px', alignSelf: 'center',
        color: color,
        textAlign: 'center',
        fontFamily: 'Poppins',
        fontSize: fontSizee.length > 0 ? fontSizee : '12px',
        fontStyle: 'normal',
        fontWeight: 500,
        lineHeight: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    }));
    return (
        <PillColor >{title}</PillColor>
    )
}

export default EstadoPill