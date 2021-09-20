import { 
    Button,
    Modal,
    ModalHeader,
    ModalOverlay, 
    ModalContent, 
    ModalBody, 
    ModalCloseButton} from '@chakra-ui/react'

import './WalletsModal.css';

export default function WalletsModal(props) {

    return (
      <>
        <Modal onClose={props.onClose} size="sm" isOpen={props.isOpen}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Choose your wand!</ModalHeader>
            <ModalBody>
            <Button className="metamask-btn" onClick={props.selectMetamask}>Metamask</Button>
            <Button onClick={props.selectWalletConnect}>WalletConnect</Button>
            </ModalBody>
            <ModalCloseButton />
              <Button onClick={props.onClose}>Close</Button>
          </ModalContent>
        </Modal>
      </>
    )
  }