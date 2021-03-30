import React, { useState, useEffect } from 'react'
import { Tree } from 'antd'
const { TreeNode } = Tree
import { makeStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import Container from '@material-ui/core/Container'
import { client } from '../utilities/client'
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
import { avoidCircularReference } from '../utilities/serialize'
import uuid from 'react-uuid'
import NavBar from './NavBar'

const useStyles = makeStyles(theme => ({
  main: {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    justify: 'flex-start',
    flexDirection: 'column',
    textAlign: 'left',
    margin: theme.spacing(0, 0, 0, 0),
    overflow: 'hidden',
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
    padding: 8,
  },
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

export default function MenuTree (props) {
  const [treeData, setTreeData] = useState([])
  const [expandedKeys, setExpandedKeys] = useState([])
  const [selectedKeys, setSelectedKeys] = useState([])
  const [itemModal, setItemModal] = useState(false)
  const [addingItem, setAddingItem] = useState(false)
  const [itemSelected, setItemSelected] = useState({})
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false)
  const classes = useStyles()

  useEffect(() => {
    setItemSelected({})
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

  const fillTree = tree => {
    return tree.map(branch => {
      branch.text = branch.title
      branch.as = branch.title
      branch.href = branch.title
      if (branch.children) {
        branch.items = fillTree(branch.children)
      } else {
        branch.expanded = false
      }
      return branch
    })
  }

  const itemAdd = () => {
    const newItem = { key: uuid(), title: '', children: [] }
    updateItemSelected(newItem)
    setAddingItem(true)
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
    // Walk the tree and update it.
    const updatedTree = deleteNode(treeData, itemSelected)

    setTreeData(updatedTree)
    props.saveTree(updatedTree)

    setConfirmDeleteDialog(false)
  }

  const itemCancel = () => {
    updateItemSelected({})
    setAddingItem(false)
    setItemModal(false)
  }

  const itemSave = async () => {
    let updatedTree = []
    if (addingItem) {
      updatedTree = [itemSelected].concat(treeData)
      setAddingItem(false)
    } else {
      updatedTree = updateNode(treeData, itemSelected)
    }

    setTreeData(updatedTree)
    props.saveTree(updatedTree)

    setItemModal(false)
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

  const deleteNode = (nodes, nodeToDelete) => {
    return nodes
      .map(node => {
        if (node.children) {
          node.children = deleteNode(node.children, nodeToDelete)
        }
        return nodeToDelete.key == node.key ? null : node
      })
      .filter(noNull => noNull)
  }

  const updateNode = (nodes, nodeToUpdate) => {
    return nodes.map(node => {
      if (node.children) {
        node.children = updateNode(node.children, nodeToUpdate)
      }
      return nodeToUpdate.key == node.key ? nodeToUpdate : node
    })
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
    setItemSelected(node.dataRef)
  }

  const onDragEnter = info => {
    //console.log(info)
  }

  const onDrop = info => {
    //console.log(info)
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
    props.saveTree(data)
  }

  return (
    <Container maxWidth='lg'>
      <div className={classes.main}>
        <NavBar style={{ border: '1px solid red' }} tabs={fillTree(treeData || [])} />
        <Grid container direction='row' justify='flex-start' style={{ marginLeft: 64 }}>
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
                  id='title'
                  name='title'
                  label='Title'
                  defaultValue={itemSelected.title || ''}
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
