import React, { useContext, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Toaster, toast } from 'react-hot-toast'

import { mainUrl } from "../../../config.json"
import AuthContext from '../../context/AuthContext'
import { get, post } from '../../utility'
import PortalModal from '../../components/PortalModal/PortalModal'

function AdminOrders() {
  const authContext = useContext(AuthContext)

  const [orders, setOrders] = useState([])
  const [modal, setModal] = useState({ show: false, order: {} })

  useEffect(() => {
    get(`/admins/orders/all?token=${authContext.userToken}`)
      .then(response => {
        console.log(response);
        if (response.data.ok) {
          setOrders(response.data.orders)
        }
        console.log(response.data);
      })
  }, [authContext])

  function changeStatus(orderId, currentStatus) {
    const bodyRequest = {
      token: authContext.userToken,
      id: orderId,
      status: currentStatus
    }

    post('/admins/orders/status', bodyRequest)
      .then(() => {
        setOrders(prev => {
          const newOrders = prev.map(order => {
            if (order.id === orderId) {
              order.status = currentStatus
              return order
            }

            return order
          })

          const findOrder = prev.find(order => order.id === orderId)
          setModal(prev => ({ ...prev, order: findOrder }))

          return newOrders
        })
        toast.success('تغییر وضعیت با موفقیت انجام شد')
      })
      .catch(error => toast.error(error.response.data.err))
  }

  return (
    <>
      <div className='w-full h-full flex flex-col items-center'>
        <h1 className='w-full text-right text-xl sansbold mt-6'>لیست کاربران</h1>
        <div className="w-full rounded-xl overflow-x-scroll mt-3
        lg:overflow-hidden">
          {
            orders.length > 0 && (
              <table className='table'>
                <thead className='thead'>
                  <tr className='thead__tr'>
                    <th className='thead__tr__th w-2/12'>کد سفارش</th>
                    <th className='thead__tr__th w-3/12'>نام دستگاه</th>
                    <th className='thead__tr__th w-3/12'>قطعات</th>
                    <th className='thead__tr__th w-2/12'>هزینه نهایی</th>
                    <th className='thead__tr__th w-2/12'>تاریخ</th>
                  </tr>
                </thead>
                <tbody className='tbody'>
                  {
                    orders.map(order => {
                      return (
                        <tr
                          key={order.id}
                          className='tbody__tr cursor-pointer'
                          onClick={() => {
                            setModal({ show: true, order: order })
                          }}
                        >
                          <td className='tbody__tr__td w-2/12'>
                            <div className='td__wrapper justify-center'>
                              {
                                order.status === 'done' ? (
                                  <button className='badge badge-success select-text'>{order.id} #</button>
                                ) : order.status === 'working' ? (
                                  <button className='badge badge-warning select-text'>{order.id} #</button>
                                ) : order.status === 'pending' ? (
                                  <button className='badge badge-blue select-text'>{order.id} #</button>
                                ) : order.status === 'cancelled' ? (
                                  <button className='badge badge-danger select-text'>{order.id} #</button>
                                ) : ''
                              }
                            </div>
                          </td>
                          <td className='tbody__tr__td w-3/12 text-sm'>{order.phoneName}</td>
                          <td className='tbody__tr__td w-3/12'>
                            <div className="td__wrapper">
                              <span className='text-xs'>{order.partName}</span>
                            </div>
                          </td>
                          <td className='tbody__tr__td w-2/12 text-sm'>
                            {
                              order.total ? (
                                <>
                                  39,000,000
                                  <small className='italic opacity-75 mx-1'>تومان</small>
                                </>
                              ) : '-'
                            }
                          </td>
                          <td className='tbody__tr__td w-2/12 text-sm'>
                            {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                          </td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            )
          }
        </div>
      </div >
      {
        modal.show && createPortal(
          <PortalModal closeHandler={() => setModal({ show: false, order: {} })}>
            <ul className="w-96 max-h-[80vh] overflow-y-scroll rounded-md">
              <li className='w-full rounded-md
                flex justify-center items-center gap-1'>
                <button
                  className='bg-red-500 text-white w-1/3 h-9 text-sm
                    py-2 px-6 rounded-md shadow-2xl shadow-black'
                  onClick={() => changeStatus(modal.order.id, 'cancelled')}
                >
                  لغو کردن
                </button>
                <button
                  className='bg-yellow-500 text-white w-1/3 h-9 text-sm
                    py-2 px-6 rounded-md shadow-2xl shadow-black'
                  onClick={() => changeStatus(modal.order.id, 'working')}
                >
                  تایید کردن
                </button>
                <button
                  className='bg-green-500 text-white w-1/3 h-9 text-sm
                    py-2 px-6 rounded-md shadow-2xl shadow-black'
                  onClick={() => changeStatus(modal.order.id, 'done')}
                >
                  تمام شده
                </button>
              </li>

              <li className='w-full flex justify-center items-center rounded-md mt-1'>
                <div className='w-full bg-textarea'>
                  <textarea
                    className='textarea border-0 rounded-md focus:ring-0'
                    placeholder='توضیحات را وارد کنید'
                  >
                  </textarea>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="svg-textarea">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                  </svg>
                </div>
              </li>

              <li className='w-full flex justify-center items-center rounded-md mt-3'>
                <div className="bg-blue-100 text-blue-500 w-4/12 p-3 rounded-r-md text-center">
                  کد سفارش
                </div>
                <div className="bg-white w-8/12 flex justify-center items-center p-3 rounded-l-md">
                  {modal.order.id} #
                </div>
              </li>

              <li className='w-full flex justify-center items-center rounded-md mt-1'>
                <div className="bg-blue-100 text-blue-500 w-4/12 p-3 rounded-r-md text-center">
                  وضعیت
                </div>
                <div className="bg-white w-8/12 flex justify-center items-center p-3 rounded-l-md">
                  {
                    modal.order.status === 'pending' ? 'در انتظار تعمیر'
                      : modal.order.status === 'working' ? 'تایید شده'
                        : modal.order.status === 'cancelled' ? 'لغو شده'
                          : modal.order.status === 'done' ? 'انجام شده'
                            : ''
                  }
                </div>
              </li>

              <li className='w-full flex justify-center items-center rounded-md mt-1'>
                <div className="bg-blue-100 text-blue-500 w-4/12 p-3 rounded-r-md text-center">
                  کاربر
                </div>
                <div className="bg-white w-8/12 flex justify-center items-center p-3 rounded-l-md">
                  {modal.order.user.firstName} {modal.order.user.lastName}
                </div>
              </li>

              <li className='w-full flex justify-center items-center rounded-md mt-1'>
                <div className="bg-blue-100 text-blue-500 w-4/12 p-3 rounded-r-md text-center">
                  تعمیر کننده
                </div>
                <div className="bg-white w-8/12 flex justify-center items-center p-3 rounded-l-md">
                  {
                    modal.order.repairMan ?
                      `${modal.order.repairMan.firstName} ${modal.order.repairMan.firstName}`
                      : '-'
                  }
                </div>
              </li>

              <li className='w-full flex justify-center items-center rounded-md mt-1'>
                <div className="bg-blue-100 text-blue-500 w-4/12 p-3 rounded-r-md text-center">
                  دستگاه
                </div>
                <div className="bg-white w-8/12 flex justify-center items-center p-3 rounded-l-md">
                  {modal.order.phoneName}
                </div>
              </li>

              <li className='w-full flex justify-center items-center rounded-md mt-1'>
                <div className="bg-blue-100 text-blue-500 w-4/12 p-3 rounded-r-md text-center">
                  قطعه
                </div>
                <div className="bg-white w-8/12 flex justify-center items-center p-3 rounded-l-md">
                  {modal.order.partName}
                </div>
              </li>

              <li className='w-full flex justify-center items-center rounded-md mt-1'>
                <div className="bg-blue-100 text-blue-500 w-4/12 p-3 rounded-r-md text-center">
                  تاریخ
                </div>
                <div className="bg-white w-8/12 flex justify-center items-center p-3 rounded-l-md">
                  {new Date(modal.order.createdAt).toLocaleDateString('fa-IR')}
                </div>
              </li>

              <li className='w-full flex justify-center items-center rounded-md mt-1'>
                <div className="bg-blue-100 text-blue-500 w-4/12 p-3 rounded-r-md text-center">
                  قیمت
                </div>
                <div className="bg-white w-8/12 flex justify-center items-center p-3 rounded-l-md">
                  {
                    modal.order.total ? (
                      <>
                        {modal.order.total}
                        <small className='italic opacity-75 mx-1'>تومان</small>
                      </>
                    ) : '-'
                  }
                </div>
              </li>

              <li className='w-full flex justify-center items-center rounded-md mt-1'>
                <div className="bg-blue-100 text-blue-500 w-4/12 p-3 rounded-r-md text-center">
                  تصویر
                </div>
                <div className="bg-white w-8/12 flex justify-center items-center p-3 rounded-l-md">
                  <a
                    className='underline'
                    href={`${mainUrl}/uploads/${modal.order.picture}`}
                    target='_blank'
                  >مشاهده</a>
                </div>
              </li>

              <li className='w-full flex flex-col justify-center items-center rounded-md mt-1'>
                <div className="bg-blue-100 text-blue-500 w-full p-3 rounded-t-md text-center">
                  آدرس
                </div>
                <div className="bg-white w-full flex justify-center items-center p-3 rounded-b-md
                  text-center">
                  {modal.order.address}
                </div>
              </li>

              <li className='w-full flex flex-col justify-center items-center rounded-md mt-1 '>
                <div className="bg-blue-100 text-blue-500 w-full p-3 rounded-t-md text-center">
                  توضیحات
                </div>
                <div className="bg-white w-full flex justify-center items-center p-3 rounded-b-md
                  text-center">
                  {modal.order.description}
                </div>
              </li>
            </ul>
          </PortalModal>,
          document.body
        )
      }

      <Toaster />
    </>
  )
}

export default AdminOrders