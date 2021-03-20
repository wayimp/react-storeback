import React, { useState, useEffect } from 'react'
import { Tree } from 'antd'
import { makeStyles } from '@material-ui/core/styles'
import Container from '@material-ui/core/Container'
import Grid from '@material-ui/core/Grid'
import IconButton from '@material-ui/core/IconButton'
import AccountTreeOutlinedIcon from '@material-ui/icons/AccountTreeOutlined'
import CheckBoxOutlineBlankOutlinedIcon from '@material-ui/icons/CheckBoxOutlineBlankOutlined'
import CheckBoxOutlinedIcon from '@material-ui/icons/CheckBoxOutlined'

const useStyles = makeStyles(theme => ({
  main: {
    width: '100%',
    height: 500,
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
    border: '2px solid black',
    marginBottom: 8,
    borderRadius: 3,
    backgroundColor: theme.palette.secondary.light,
    padding: 7,
  },
}))
/*
const treeDataTest = [
  {
    title: (
      <Card
        style={{
          width: 200,
          height: 80,
          background: 'lightpink',
        }}
      >
        Vehicles
      </Card>
    ),
    key: '0-0',
    children: [
      {
        title: (
          <Card
            style={{
              width: 200,
              height: 80,
              background: 'lightblue',
            }}
          >
            Cars
          </Card>
        ),
        key: '0-0-0',
        children: [
          {
            title: (
              <Card
                style={{
                  width: 200,
                  height: 80,
                  background: 'lightgrey',
                }}
              >
                Chevy
              </Card>
            ),
            key: '0-0-0-0',
            disableCheckbox: true,
          },
          {
            title: (
              <Card
                style={{
                  width: 200,
                  height: 80,
                  background: 'lightgrey',
                }}
              >
                Ford
              </Card>
            ),
            key: '0-0-0-1',
          },
        ],
      },
      {
        title: (
          <Card
            style={{
              width: 200,
              height: 80,
              background: 'lightpink',
            }}
          >
            Plants
          </Card>
        ),
        key: '0-0-1',
        children: [
          {
            title: (
              <Card
                style={{
                  width: 200,
                  height: 80,
                  background: 'lightblue',
                }}
              >
                Flowers
              </Card>
            ),
            key: '0-0-1-0',
          },
        ],
      },
    ],
  },
]
*/
const treeDataTest2 = [{ title: 'Vehicles', key: '0-0', children: [{ title: 'Cars', key: '0-1' }] }]

export default function MenuTree (props) {
  const [treeData, setTreeData] = useState([])
  const [expandedKeys, setExpandedKeys] = useState([])
  const classes = useStyles()

  const convertTree = nodes => {
    const converted = []
    nodes.map(node => {
      const mapNode = {
        title: (
          <Grid
            container
            direction='row'
            justify='flex-start'
            alignItems='center'
            className={classes.listItem}
          >
            <IconButton>
              <CheckBoxOutlinedIcon />
            </IconButton>
            {node.title}
          </Grid>
        ),
        key: node.key,
      }
      if (node.children) {
        mapNode.children = convertTree(node.children)
      }
      converted.push(mapNode)
    })
    return converted
  }

  useEffect(() => {
    const tree = props && props.menu && props.menu.tree ? props.menu.tree : []
    const converted = convertTree(tree)
    setTreeData(converted)
  }, [props])

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
        <Tree
          className='draggable-tree'
          defaultExpandedKeys={expandedKeys}
          draggable
          blockNode
          onDragEnter={onDragEnter}
          onDrop={onDrop}
          treeData={treeData}
        />
      </div>
      {Array.isArray(props.menu.tree) + ' Child tree: ' + JSON.stringify(props.menu.tree)}
    </Container>
  )
}
