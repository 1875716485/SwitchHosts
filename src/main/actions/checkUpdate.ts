/**
 * checkVersion
 * @author: oldj
 * @homepage: https://oldj.net
 */

import { broadcast } from '@main/core/agent'
import { localdb } from '@main/data'
import { GET } from '@main/libs/request'
import { server_url } from '@root/common/constants'
import events from '@root/common/events'
import version from '@root/version.json'
import compareVersions from 'compare-versions'
import { v4 as uuid4 } from 'uuid'
import type { AxiosResponse } from 'axios'

const getUniqueId = async (): Promise<string> => {
  let uid: string | undefined = await localdb.dict.local.get('uid')
  if (!uid) {
    uid = uuid4()
    await localdb.dict.local.set('uid', uid)
  }
  return uid
}

export default async (): Promise<boolean | null> => {
  // Check the latest version, also used for anonymous statistics of DAU,
  // no personal information will be sent.
  let r: AxiosResponse | null = null

  try {
    r = await GET(`${server_url}/api/check/`, {
      sid: global.session_id,
      uid: await getUniqueId(),
    })
  } catch (e) {
    console.error(e)
  }

  if (!r || r.status !== 200 || !r.data?.success) {
    return null
  }

  let server_version = r.data.data.version
  let local_version = version.slice(0, 3).join('.')

  if (compareVersions(server_version, local_version) === 1) {
    // new version found
    console.log(`new version: ${server_version}`)
    broadcast(events.new_version, server_version)
    // 有更新
    return true
  }

  // 没有更新
  return false
}
