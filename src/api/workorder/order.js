import request from '@/utils/request'

// 查询工单信息列表
export function listOrder(query) {
  return request({
    url: '/workorder/order/list',
    method: 'get',
    params: query
  })
}

// 查询工单信息详细
export function getOrder(orderId) {
  return request({
    url: '/workorder/order/' + orderId,
    method: 'get'
  })
}

// 新增工单信息
export function addOrder(data) {
  return request({
    url: '/workorder/order',
    method: 'post',
    data: data
  })
}

// 修改工单信息
export function updateOrder(data) {
  return request({
    url: '/workorder/order',
    method: 'put',
    data: data
  })
}

// 删除工单信息
export function delOrder(orderId) {
  return request({
    url: '/workorder/order/' + orderId,
    method: 'delete'
  })
}
