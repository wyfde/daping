import request from '@/utils/request'

// 查询仓库信息列表
export function listManage(query) {
  return request({
    url: '/storage/manage/list',
    method: 'get',
    params: query
  })
}

// 查询仓库信息详细
export function getManage(storageId) {
  return request({
    url: '/storage/manage/' + storageId,
    method: 'get'
  })
}

// 新增仓库信息
export function addManage(data) {
  return request({
    url: '/storage/manage',
    method: 'post',
    data: data
  })
}

// 修改仓库信息
export function updateManage(data) {
  return request({
    url: '/storage/manage',
    method: 'put',
    data: data
  })
}

// 删除仓库信息
export function delManage(storageId) {
  return request({
    url: '/storage/manage/' + storageId,
    method: 'delete'
  })
}
