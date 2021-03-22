import React, { useState } from 'react'
import RootRef from '@material-ui/core/RootRef'
import { Container, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import Button from '@material-ui/core/Button'
import FormatListNumberedIcon from '@material-ui/icons/FormatListNumbered'
import { appData } from '../data/appData'
import { client } from '../data/client'
import { useSnackbar } from 'notistack'
import AddIcon from '@material-ui/icons/Add'
import Modal from '@material-ui/core/Modal'
import Backdrop from '@material-ui/core/Backdrop'
import Fade from '@material-ui/core/Fade'
import FormControl from '@material-ui/core/FormControl'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import TextField from '@material-ui/core/TextField'
import Grid from '@material-ui/core/Grid'
import EditIcon from '@material-ui/icons/Edit'
import SaveIcon from '@material-ui/icons/Save'
import CancelIcon from '@material-ui/icons/Cancel'
import DeleteOutlineOutlinedIcon from '@material-ui/icons/DeleteOutlineOutlined'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogActions from '@material-ui/core/DialogActions'
import IconButton from '@material-ui/core/IconButton'
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked'
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked'
import AccountTreeOutlinedIcon from '@material-ui/icons/AccountTreeOutlined'
import { isEmpty } from 'lodash'
import MenuTree from './MenuTree'

const ITEM_NAME = 'Menu'
const API_PATH = 'menus'

const useStyles = makeStyles(theme => ({
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: theme.spacing(2),
    padding: theme.spacing(2),
  },
  paper: {
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
  textField: {
    margin: theme.spacing(2),
    padding: theme.spacing(2),
  },
}))

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)

  return result
}

const grid = 8

const getListStyle = isDraggingOver => ({
  background: '#FFF', //isDraggingOver ? 'lightblue' : 'lightgrey',
  padding: grid,
  width: 250,
  position: 'relative',
})

export default function ItemListDisplay (props) {
  const classes = useStyles()
  const { enqueueSnackbar } = useSnackbar()
  const [itemModal, setItemModal] = useState(false)
  const [itemSelected, setItemSelected] = useState({})
  const [items, setItems] = useState(props[API_PATH] || [])
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false)
  const queryAttr = 'data-rbd-drag-handle-draggable-id'
  const [placeholderProps, setPlaceholderProps] = useState({})

  const getItemStyle = (isSelected, isDragging, draggableStyle) => ({
    width: 250,
    userSelect: 'none',
    padding: grid * 2,
    marginBottom: grid,
    borderRadius: 3,

    border: isDragging ? '1px solid green' : isSelected ? '1px solid black' : '1px solid grey',
    background: isSelected ? '#dbfffc' : '#d6dcf9',

    // styles we need to apply on draggables
    ...draggableStyle,
  })

  const updateItemSelected = item => {
    setItemSelected(item)
  }

  const changeValue = async (name, value) => {
    const updated = {
      ...itemSelected,
      [name]: value,
    }
    updateItemSelected(updated)
  }

  const changeField = event => {
    const fieldName = event.target.name
    const fieldValue = event.target.value
    changeValue(fieldName, fieldValue)
  }

  const itemAdd = () => {
    const index =
      Math.max.apply(
        Math,
        items.map(item => item.index)
      ) + 1
    const newItem = { index, name: '', tree: [] }
    updateItemSelected(newItem)
    setItemModal(true)
  }

  const itemEdit = () => {
    if (itemSelected) {
      setItemModal(true)
    }
  }

  const confirmDelete = () => {
    if (itemSelected) {
      setConfirmDeleteDialog(true)
    }
  }

  const itemDelete = async () => {
    // Remove item and reorder
    const updatedItems = items
      .map(item => {
        if (item._id !== itemSelected._id) return item
      })
      .filter(noNull => noNull)
      .sort((a, b) => (a.index > b.index ? 1 : -1))
    setItems(updatedItems)
    itemOrderSave(updatedItems)
    setItemSelected({})
    setItemModal(false)

    client({
      method: 'delete',
      url: `/${API_PATH}/${itemSelected._id}`,
    })
      .then(response => {
        enqueueSnackbar(`${ITEM_NAME} Deleted`, {
          variant: 'success',
        })
        // Put this into the list in order
        const updatedItems = items
          .map(item => {
            if (item._id !== itemSelected._id) return item
          })
          .filter(noNull => noNull)
      })
      .catch(error => {
        enqueueSnackbar(`Error Deleting ${ITEM_NAME}: ${error}`, {
          variant: 'error',
        })
      })
    setConfirmDeleteDialog(false)
  }

  const itemCancel = () => {
    updateItemSelected({})
    setItemModal(false)
  }

  const itemSave = async () => {
    const itemToSave = JSON.parse(JSON.stringify(itemSelected))
    setItemSelected({})
    setItemModal(false)

    client({
      method: 'patch',
      url: `/${API_PATH}`,
      data: itemToSave,
    })
      .then(response => {
        enqueueSnackbar(`${ITEM_NAME} Saved`, {
          variant: 'success',
        })
        // Put this into the list in order
        const updatedItems = items
          .map(item => {
            if (item._id !== itemToSave._id) return item
          })
          .filter(noNull => noNull)
          .concat(response.data) // Saved with _id
          .sort((a, b) => (a.index > b.index ? 1 : -1))
        setItems(updatedItems)
        itemOrderSave(updatedItems)
      })
      .catch(error => {
        enqueueSnackbar(`Error Saving ${ITEM_NAME}: ${error}`, {
          variant: 'error',
        })
      })
  }

  const itemOrderSave = async reordered => {
    const updates = reordered.map((update, index) => {
      update.index = index
      return update
    })

    client({
      method: 'post',
      url: `/${API_PATH}-order`,
      data: updates,
    })
      .then(response => {
        enqueueSnackbar(`${ITEM_NAME} Order Saved`, {
          variant: 'success',
        })
      })
      .catch(error => {
        enqueueSnackbar(`Error Saving ${ITEM_NAME} Order: ${error}`, {
          variant: 'error',
        })
      })
  }

  const handleDragStart = event => {
    const draggedDOM = getDraggedDom(event.draggableId)

    if (!draggedDOM) {
      return
    }

    const { clientHeight, clientWidth } = draggedDOM
    const sourceIndex = event.source.index
    var clientY =
      parseFloat(window.getComputedStyle(draggedDOM.parentNode).paddingTop) +
      [...draggedDOM.parentNode.children].slice(0, sourceIndex).reduce((total, curr) => {
        const style = curr.currentStyle || window.getComputedStyle(curr)
        const marginBottom = parseFloat(style.marginBottom)
        return total + curr.clientHeight + marginBottom
      }, 0)

    setPlaceholderProps({
      clientHeight,
      clientWidth,
      clientY,
      clientX: parseFloat(window.getComputedStyle(draggedDOM.parentNode).paddingLeft),
    })
  }

  const handleDragEnd = result => {
    setPlaceholderProps({})
    // dropped outside the list
    if (!result.destination) {
      return
    }

    const reordered = reorder(items, result.source.index, result.destination.index)

    setItems(reordered)
    itemOrderSave(reordered)
  }

  const handleDragUpdate = event => {
    if (!event.destination) {
      return
    }

    const draggedDOM = getDraggedDom(event.draggableId)

    if (!draggedDOM) {
      return
    }

    const { clientHeight, clientWidth } = draggedDOM
    const destinationIndex = event.destination.index
    const sourceIndex = event.source.index

    const childrenArray = [...draggedDOM.parentNode.children]
    const movedItem = childrenArray[sourceIndex]
    childrenArray.splice(sourceIndex, 1)

    const updatedArray = [
      ...childrenArray.slice(0, destinationIndex),
      movedItem,
      ...childrenArray.slice(destinationIndex + 1),
    ]

    var clientY =
      grid +
      updatedArray.slice(0, destinationIndex).reduce((total, curr) => {
        const style = curr.currentStyle || window.getComputedStyle(curr)
        const marginBottom = parseFloat(style.marginBottom)
        return total + curr.clientHeight + marginBottom + destinationIndex
      }, 0)

    setPlaceholderProps({
      clientHeight,
      clientWidth,
      clientY,
      clientX: parseFloat(window.getComputedStyle(draggedDOM.parentNode).paddingLeft),
    })
  }

  const getDraggedDom = draggableId => {
    const domQuery = `[${queryAttr}='${draggableId}']`
    const draggedDOM = document.querySelector(domQuery)

    return draggedDOM
  }

  return (
    <>
      <Container maxWidth='lg'>
        <div className={classes.main}>
          <Grid container direction='row' justify='flex-start' alignItems='flex-start'>
            <Grid item xs={3}>
              <Grid container direction='row' justify='flex-start'>
                <IconButton color='primary' onClick={itemAdd}>
                  <AddIcon fontSize='large' />
                </IconButton>
                {itemSelected && itemSelected._id ? (
                  <>
                    <IconButton color='secondary' onClick={itemEdit}>
                      <EditIcon fontSize='large' />
                    </IconButton>
                    <IconButton color='secondary' onClick={confirmDelete}>
                      <DeleteOutlineOutlinedIcon fontSize='large' />
                    </IconButton>
                    {/*<IconButton color='secondary' onClick={editTree}>
                  <AccountTreeOutlinedIcon fontSize='large' />
                </IconButton>*/}
                  </>
                ) : (
                  ''
                )}
              </Grid>
              <DragDropContext
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
                onDragUpdate={handleDragUpdate}
              >
                <Droppable droppableId='droppable'>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      style={getListStyle(snapshot.isDraggingOver)}
                    >
                      {items.map((item, index) => {
                        const isSelected = itemSelected && itemSelected._id == item._id
                        return (
                          <Draggable key={item._id} draggableId={item._id} index={index}>
                            {(provided, snapshot) => (
                              <Grid
                                container
                                direction='row'
                                justify='flex-start'
                                alignItems='center'
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={getItemStyle(
                                  isSelected,
                                  snapshot.isDragging,
                                  provided.draggableProps.style
                                )}
                              >
                                <IconButton
                                  onClick={() => updateItemSelected(isSelected ? {} : item)}
                                >
                                  {isSelected ? (
                                    <RadioButtonCheckedIcon />
                                  ) : (
                                    <RadioButtonUncheckedIcon />
                                  )}
                                </IconButton>
                                {item.name}
                              </Grid>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}
                      {!isEmpty(placeholderProps) && snapshot.isDraggingOver && (
                        <div
                          className='placeholder'
                          style={{
                            top: placeholderProps.clientY,
                            left: placeholderProps.clientX,
                            height: placeholderProps.clientHeight,
                            width: placeholderProps.clientWidth,
                          }}
                        />
                      )}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </Grid>
            <Grid item xs={9}>
              <MenuTree menu={itemSelected} />
            </Grid>
          </Grid>
        </div>
      </Container>
      <Modal
        id='edit'
        className={classes.modal}
        open={itemModal}
        onClose={itemCancel}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={itemModal}>
          <div className={classes.paper}>
            <Grid
              container
              direction='row'
              justify='flex-start'
              alignItems='center'
              alignContent='space-between'
            >
              <FormControl>
                <TextField
                  className={classes.textField}
                  variant='outlined'
                  id='index'
                  name='index'
                  label='Index'
                  type='number'
                  InputProps={{
                    inputProps: {
                      min: 0,
                    },
                  }}
                  defaultValue={itemSelected.index || 0}
                  onChange={changeField}
                />
              </FormControl>
              <FormControl>
                <TextField
                  className={classes.textField}
                  variant='outlined'
                  id='name'
                  name='name'
                  label='Name'
                  defaultValue={itemSelected.name || ''}
                  onChange={changeField}
                />
              </FormControl>
            </Grid>
            <Grid container direction='row' justify='flex-end' alignItems='flex-start'>
              <Button
                variant='outlined'
                color='secondary'
                style={{ margin: 20 }}
                onClick={itemCancel}
                startIcon={<CancelIcon />}
              >
                Cancel
              </Button>
              <Button
                variant='outlined'
                color='primary'
                style={{ margin: 20 }}
                onClick={itemSave}
                startIcon={<SaveIcon />}
              >
                Save
              </Button>
            </Grid>
          </div>
        </Fade>
      </Modal>
      <Dialog open={confirmDeleteDialog} onClose={() => setConfirmDeleteDialog(false)}>
        <DialogTitle id='alert-dialog-title'>
          Are you sure you want to delete this item?
        </DialogTitle>
        <DialogActions>
          <Button
            variant='outlined'
            onClick={() => setConfirmDeleteDialog(false)}
            color='secondary'
          >
            Cancel
          </Button>
          <Button variant='outlined' onClick={itemDelete} color='primary' autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
