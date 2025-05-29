import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog'
import Slide from '@mui/material/Slide'
import { TransitionProps } from '@mui/material/transitions';
import { PaperProps } from '@mui/material/Paper';

interface Props {
  open: boolean
  handleOpen?: React.MouseEventHandler<HTMLButtonElement>
  handleClose?: React.MouseEventHandler<HTMLButtonElement>
  contentOfDialog: JSX.Element
  direction?: any
  paper: PaperProps
}

const TransitionRight = React.forwardRef(function Transition(
    props: TransitionProps & {
      children: React.ReactElement<any, any>;
      
    },
    ref: React.Ref<unknown>,
  ) {
    // if (direction !== undefined) {
    //   return <Slide direction={direction!} ref={ref} {...props} />;
    // } else {
      return <Slide direction="right" ref={ref} {...props} />;
    // }
  });
  
  const TransitionDown = React.forwardRef(function Transition(
    props: TransitionProps & {
      children: React.ReactElement<any, any>;
      
    },
    ref: React.Ref<unknown>,
  ) {
    return <Slide direction="down" ref={ref} {...props} />;
  });
  
  
  const DialogScreen: React.FC<Props> = ({ open, handleOpen, handleClose, contentOfDialog, direction, paper }) => {
    
    return (
      (direction !== undefined) ?
        <Dialog
          open={open}
          TransitionComponent={(direction === 'right') ? TransitionRight: TransitionDown}
          onClose={handleClose}
          maxWidth={"md"}
          PaperProps={paper}
          disableEscapeKeyDown={true}
          
        >
          {contentOfDialog}
        </Dialog>
      :
        <Dialog
            open={open}          
            maxWidth={"md"}
            PaperProps={paper}
            disableEscapeKeyDown={true}
          
          >
            {contentOfDialog}
          </Dialog>
    )
  }
  
  export default DialogScreen
