import React, { useState } from 'react'
import MenuList from '../components/MenuList'
import MenuTree from '../components/MenuTree'
import { Container, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import CmsSlot from 'react-storefront/CmsSlot'
import LoadMask from 'react-storefront/LoadMask'
import Head from 'next/head'
import Button from '@material-ui/core/Button'
import { appData } from '../data/appData'
import { client } from '../data/client'
import Grid from '@material-ui/core/Grid'

const useStyles = makeStyles(theme => ({
  main: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    flexDirection: 'column',
    textAlign: 'center',
    margin: theme.spacing(10, 0, 0, 0),
    overflow: 'auto',
  },
}))

export default function Menus (props) {
  const classes = useStyles()

  return (
    <>
      <Head>
        <title>{props.pageData.title}</title>
      </Head>
      <Container maxWidth='lg'>
        <div className={classes.main}>
          <MenuList menus={props.pageData.menus} />
        </div>
      </Container>
    </>
  )
}

export async function getServerSideProps (context) {
  const pageData = await client.get('/menus').then(response => response.data)

  return {
    props: {
      appData,
      pageData,
    },
  }
}
