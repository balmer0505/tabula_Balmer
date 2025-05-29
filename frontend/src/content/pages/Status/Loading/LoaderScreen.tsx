import CSS from 'csstype'
import { Box } from '@mui/material';
// import imagen from '/assets/carga/CARGA INFOMATICA-1.7s-800px';
import imagen from '../../../../assets/CARGA INFOMATICA-1.7s-800px.svg';
import zIndex from '@mui/material/styles/zIndex';

const LoaderScreen = () => {
    const gifStyle: CSS.Properties = {
        width: '30vw',
        height: '30vh',

    }
    return (
        <Box sx={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            // zIndex: 10,
            zIndex: 9999,
            transform: 'translate(0%, 0%)',
            backdropFilter: 'blur(5px)',
            background: 'filter: blur(8px)',
            // backgroundColor: 'rgba(0,0,0, 0.4)',
            paddingLeft: { xs: '0px', sm: '0px', md: '0px', lg: '0px', xl: '0px' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {/* <Box style={containerImages}> */}
            <img src={imagen} style={gifStyle} />
            {/* </Box> */}
        </Box>
    )
}

export default LoaderScreen;