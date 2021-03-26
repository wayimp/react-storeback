import React, { useState } from 'react'
import SettingList from '../components/SettingList'
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

export default function Settings (props) {
  const classes = useStyles()

  return (
    <>
      <Head>
        <title>{props.pageData.title}</title>
      </Head>
      <Container maxWidth='lg'>
        <div className={classes.main}>
          <SettingList settings={props.pageData.settings} />
        </div>
      </Container>
    </>
  )
}

export async function getServerSideProps (context) {
  const pageData = await client.get('/settings').then(response => response.data)

  return {
    props: {
      appData,
      pageData,
    },
  }
}
