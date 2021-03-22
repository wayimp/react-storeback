import React, { useState, useEffect } from 'react'
import { Tree } from 'antd'
const { TreeNode } = Tree
import { makeStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import Container from '@material-ui/core/Container'
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
import IconButton from '@material-ui/core/IconButton'
import AccountTreeOutlinedIcon from '@material-ui/icons/AccountTreeOutlined'
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked'
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked'
import EditIcon from '@material-ui/icons/Edit'
import SaveIcon from '@material-ui/icons/Save'
import CancelIcon from '@material-ui/icons/Cancel'
import DeleteOutlineOutlinedIcon from '@material-ui/icons/DeleteOutlineOutlined'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogActions from '@material-ui/core/DialogActions'

const useStyles = makeStyles(theme => ({
  main: {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    flexDirection: 'column',
    textAlign: 'left',
    margin: theme.spacing(10, 0, 0, 0),
    overflow: 'auto',
  },
  card: {
    width: 200,
    height: 80,
    background: 'lightpink',
  },
  listItem: {
    width: 200,
    border: '1px solid grey',
    marginBottom: 8,
    borderRadius: 3,
    backgroundColor: theme.palette.primary.light,
    padding: 8,
  },
  listItemSelected: {
    width: 200,
    border: '1px solid black',
    marginBottom: 8,
    borderRadius: 3,
    backgroundColor: theme.palette.secondary.light,
    padding: 7,
  },
}))

export default function MenuTree (props) {
  const [treeData, setTreeData] = useState([])
  const [expandedKeys, setExpandedKeys] = useState([])
  const [selectedKeys, setSelectedKeys] = useState([])
  const [itemModal, setItemModal] = useState(false)
  const [itemSelected, setItemSelected] = useState({})
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false)
  const classes = useStyles()

  useEffect(() => {
    const tree = props && props.menu && props.menu.tree ? props.menu.tree : []
    setTreeData(tree)
  }, [props])

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

  const getNodeDisplay = node => {
    const isSelected = selectedKeys.includes(node.key)
    return (
      <Grid
        container
        direction='row'
        justify='flex-start'
        alignItems='center'
        className={isSelected ? classes.listItemSelected : classes.listItem}
      >
        <IconButton>
          {isSelected ? <RadioButtonCheckedIcon /> : <RadioButtonUncheckedIcon />}
        </IconButton>
        {node.title}
      </Grid>
    )
  }

  const renderTreeNodes = nodes => {
    return nodes.map(node => {
      if (node.children) {
        return (
          <TreeNode title={getNodeDisplay(node)} key={node.key} dataRef={node}>
            {renderTreeNodes(node.children)}
          </TreeNode>
        )
      }
      return <TreeNode title={getNodeDisplay(node)} key={node.key} dataRef={node} />
    })
  }

  const onSelect = (keys, info) => {
    setSelectedKeys(keys)
    const { node } = info
    setItemSelected(node)
  }

  const onDragEnter = info => {
    console.log(info)
  }

  const onDrop = info => {
    console.log(info)
    const dropKey = info.node.key
    const dragKey = info.dragNode.key
    const dropPos = info.node.pos.split('-')
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1])

    const loop = (data, key, callback) => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].key === key) {
          return callback(data[i], i, data)
        }
        if (data[i].children) {
          loop(data[i].children, key, callback)
        }
      }
    }
    const data = [...treeData]

    // Find dragObject
    let dragObj
    loop(data, dragKey, (item, index, arr) => {
      arr.splice(index, 1)
      dragObj = item
    })

    if (!info.dropToGap) {
      // Drop on the content
      loop(data, dropKey, item => {
        item.children = item.children || []
        // where to insert 示例添加到头部，可以是随意位置
        item.children.unshift(dragObj)
      })
    } else if (
      (info.node.props.children || []).length > 0 && // Has children
      info.node.props.expanded && // Is expanded
      dropPosition === 1 // On the bottom gap
    ) {
      loop(data, dropKey, item => {
        item.children = item.children || []
        // where to insert 示例添加到头部，可以是随意位置
        item.children.unshift(dragObj)
        // in previous version, we use item.children.push(dragObj) to insert the
        // item to the tail of the children
      })
    } else {
      let ar
      let i
      loop(data, dropKey, (item, index, arr) => {
        ar = arr
        i = index
      })
      if (dropPosition === -1) {
        ar.splice(i, 0, dragObj)
      } else {
        ar.splice(i + 1, 0, dragObj)
      }
    }

    setTreeData(data)
  }

  return (
    <Container maxWidth='lg'>
      <div className={classes.main}>
        <Grid container direction='row' justify='flex-start'>
          <IconButton color='primary' onClick={itemAdd}>
            <AddIcon fontSize='large' />
          </IconButton>
          {selectedKeys && selectedKeys.length > 0 ? (
            <>
              <IconButton color='secondary' onClick={itemEdit}>
                <EditIcon fontSize='large' />
              </IconButton>
              <IconButton color='secondary' onClick={confirmDelete}>
                <DeleteOutlineOutlinedIcon fontSize='large' />
              </IconButton>
            </>
          ) : (
            ''
          )}
        </Grid>
        <Tree
          style={{ marginLeft: 20 }}
          className='draggable-tree'
          defaultExpandedKeys={expandedKeys}
          draggable
          blockNode
          onDragEnter={onDragEnter}
          onDrop={onDrop}
          onSelect={onSelect}
        >
          {renderTreeNodes(treeData)}
        </Tree>
      </div>
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
    </Container>
  )
}
