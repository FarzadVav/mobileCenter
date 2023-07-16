import React, { useContext, useState, useEffect } from 'react'
import { Toaster, toast } from 'react-hot-toast'

import { mainUrl } from "../../../config.json"
import { get, post } from '../../utility'
import { useRef } from 'react'
import AuthContext from '../../context/AuthContext'
import LoadingContext from '../../context/LoadingContext'
import Alert from '../../components/Alert/Alert'
import PortalModal from '../../components/PortalModal/PortalModal'
import OrderStatusBtn from '../../components/OrderStatusBtn/OrderStatusBtn'
import SubmitBtn from '../../components/SubmitBtn/SubmitBtn'

function AdminOrders() {
  const authContext = useContext(AuthContext)
  const loadingContext = useContext(LoadingContext)

  const [orders, setOrders] = useState([])
  const [modal, setModal] = useState({ show: false, order: {} })
  const [showAcceptOrderModal, setShowAcceptOrderModal] = useState(false)
  const [showDoneOrderModal, setShowDoneOrderModal] = useState(false)
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false)
  const [paymentOrderStatusLoding, setPaymentOrderStatusLoading] = useState({
    paymentAccept: false, accept: false, paymentDone: false, done: false, cancel: false
  })
  const [orderDesc, setOrderDesc] = useState('')

  const paymentAcceptInputRef = useRef()
  const paymentDoneInputRef = useRef()

  useEffect(() => {
    loadingContext.setProgressIsLoadingHandler(true)
    if (authContext.userToken) {
      document.title = "سفارشات - داشبورد مدیریت اپل سرویس"
      get(`/admins/orders/all?token=${authContext.userToken}`)
        .then(response => {
          setOrders(response.data.orders)
        })
        .finally(() => loadingContext.setProgressIsLoadingHandler(false))
    }
  }, [authContext.userToken])

  const acceptOrderHandler = async (event, orderId, status) => {
    event.preventDefault()

    if (status === 'payment-working' && paymentAcceptInputRef.current.value < 100_000) {
      return toast.error('حداقل قیمت 100 هزار تومان می باشد')
    }

    setPaymentOrderStatusLoading({
      paymentAccept: status === 'payment-working',
      accept: status === 'working'
    })

    const requestBody = {
      token: authContext.userToken,
      id: orderId,
      status,
      adminMessage: orderDesc || null,
      ...(status === 'payment-working' && { price: +paymentAcceptInputRef.current.value })
    }
    await post('/admins/orders/status', requestBody)
      .then(response => {
        console.log(response.data)
        setOrders(prev => {
          const newOrders = prev.map(order => {
            if (order.id === orderId) {
              return response.data.order
            }
            else {
              return order
            }
          })
          return newOrders
        })

        setModal(prev => ({ ...prev, order: response.data.order }))
        toast.success('تغییر وضعیت با موفقیت انجام شد')
      })
      .catch(error => toast.error(error.response.data.err))

    setPaymentOrderStatusLoading({
      paymentAccept: false,
      accept: false
    })
  }

  const cancelOrderHandler = async (event, orderId) => {
    event.preventDefault()

    setPaymentOrderStatusLoading({
      cancel: true
    })

    const requestBody = {
      token: authContext.userToken,
      id: orderId,
      status: 'cancelled',
      adminMessage: orderDesc || null
    }
    await post('/admins/orders/status', requestBody)
      .then(response => {
        setOrders(prev => {
          const newOrders = prev.map(order => {
            if (order.id === orderId) {
              return response.data.order
            }
            else {
              return order
            }
          })
          return newOrders
        })

        setModal(prev => ({ ...prev, order: response.data.order }))
        toast.success('تغییر وضعیت با موفقیت انجام شد')
      })
      .catch(error => toast.error(error.response.data.err))

    setPaymentOrderStatusLoading({
      cancel: false
    })
  }

  const doneOrderHandler = async (event, orderId, status) => {
    event.preventDefault()

    if (status === 'payment-done' && paymentDoneInputRef.current.value < 100_000) {
      return toast.error('حداقل قیمت 100 هزار تومان می باشد')
    }

    setPaymentOrderStatusLoading({
      paymentDone: status === 'payment-done',
      done: status === 'done'
    })

    const requestBody = {
      token: authContext.userToken,
      id: orderId,
      status,
      adminMessage: orderDesc || null,
      ...(status === 'payment-done' && { price: +paymentDoneInputRef.current.value })
    }
    await post('/admins/orders/status', requestBody)
      .then(response => {
        console.log(response.data)
        setOrders(prev => {
          const newOrders = prev.map(order => {
            if (order.id === orderId) {
              return response.data.order
            }
            else {
              return order
            }
          })
          return newOrders
        })

        setModal(prev => ({ ...prev, order: response.data.order }))
        toast.success('تغییر وضعیت با موفقیت انجام شد')
      })
      .catch(error => toast.error(error.response.data.err))

    setPaymentOrderStatusLoading({
      paymentDone: false,
      done: false
    })
  }

  return (
    <>
      <div className='w-full flex flex-col items-center show-fade'>
        <h1 className='w-full text-right text-xl sansbold'>لیست سفارشات</h1>
        {
          orders.length > 0 ? (
            <div className="w-full overflow-x-auto rounded-xl mt-1">
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
                          onClick={() => setModal({ show: true, order: order })}
                        >
                          <td className='tbody__tr__td w-2/12'>
                            <div className='td__wrapper justify-center'>
                              {
                                ['done', 'payment-done'].includes(order.status) ? (
                                  <button className='badge badge-success select-text'>{order.id} #</button>
                                ) : ['working', 'payment-working'].includes(order.status) ? (
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
                                  {modal.order.total}
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
            </div>
          ) : (
            <Alert
              theme={'danger'}
              title={'قطعه ای ثبت نشده است.'}
              icon={(
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              )}
            />
          )
        }
      </div >

      {
        modal.show && (
          <PortalModal closeHandler={() => {
            setModal({ show: false, order: {} })
            setOrderDesc('')
          }}>
            <ul className="w-[500px] max-h-[80vh] overflow-y-scroll rounded-md">
              {
                modal.order.status === 'pending' ? (
                  <li className='w-full flex justify-center items-center gap-1'>
                    <OrderStatusBtn
                      customClass={'w-full'}
                      status={'working'}
                      isLoading={false}
                      clickHandler={() => setShowAcceptOrderModal(true)}
                    >
                      تایید کردن
                    </OrderStatusBtn>
                  </li>
                ) : (
                  <>
                    <li className='w-full flex justify-center items-center gap-1'>
                      {
                        modal.order.status !== 'cancelled' && (
                          <OrderStatusBtn
                            customClass={'w-full'}
                            status={'cancelled'}
                            isLoading={false}
                            clickHandler={() => setShowCancelOrderModal(true)}
                          >
                            لغو تعمیر
                          </OrderStatusBtn>
                        )
                      }
                      <OrderStatusBtn
                        customClass={'w-full'}
                        status={'done'}
                        isLoading={false}
                        clickHandler={() => setShowDoneOrderModal(true)}
                      >
                        اتمام تعمیر
                      </OrderStatusBtn>
                    </li>
                  </>
                )
              }

              <li className='w-full flex justify-center items-center rounded-md mt-1'>
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
                            : modal.order.status === 'payment-working' ? 'تایید شده - در انتظار پرداخت'
                              : modal.order.status === 'payment-working' ? 'انجام شده - در انتظار پرداخت'
                                : ''
                  }
                </div>
              </li>

              <li className='w-full flex justify-center items-center rounded-md mt-1'>
                <div className="bg-blue-100 text-blue-500 w-4/12 p-3 rounded-r-md text-center">
                  کاربر
                </div>
                <div className="bg-white w-8/12 flex justify-center items-center p-3 rounded-l-md">
                  {
                    `${modal.order.user.firstName} ${modal.order.user.lastName} - ${modal.order.user.phone}`
                  }
                </div>
              </li>

              <li className='w-full flex justify-center items-center rounded-md mt-1'>
                <div className="bg-blue-100 text-blue-500 w-4/12 p-3 rounded-r-md text-center">
                  تعمیر کننده
                </div>
                <div className="bg-white w-8/12 flex justify-center items-center p-3 rounded-l-md">
                  {
                    modal.order.repairman ?
                      `${modal.order.repairman.firstName} ${modal.order.repairman.lastName} - ${modal.order.repairman.phone}`
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

              {
                ['payment-working', 'payment-done'].includes(modal.order.status) && (
                  <li className='w-full flex justify-center items-center rounded-md mt-1'>
                    <div className="bg-blue-100 text-blue-500 w-4/12 p-3 rounded-r-md text-center">
                      در انتظار پرداخت
                    </div>
                    <div className="bg-white w-8/12 flex justify-center items-center p-3 rounded-l-md">
                      {
                        modal.order.transactions.filter(action => action.status === 'pending')[0] &&
                        modal.order.transactions.filter(action => action.status === 'pending').map(action => action.price).reduce((prev, current) => prev + current).toLocaleString()
                      }
                      <small className='italic mr-1'>تومان</small>
                    </div>
                  </li>

                )
              }

              <li className='w-full flex justify-center items-center rounded-md mt-1'>
                <div className="bg-blue-100 text-blue-500 w-4/12 p-3 rounded-r-md text-center">
                  پرداخت شده
                </div>
                <div className="bg-white w-8/12 flex justify-center items-center p-3 rounded-l-md">
                  {
                    modal.order.total ? (
                      <>
                        {modal.order.total.toLocaleString()}
                        <small className='italic mr-1'>تومان</small>
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

              {
                modal.order.adminMessage && (
                  <li className='w-full flex flex-col justify-center items-center rounded-md mt-1'>
                    <div className="bg-blue-100 text-blue-500 w-full p-3 rounded-t-md text-center">
                      پیام شما
                    </div>
                    <div className="bg-white w-full flex justify-center items-center p-3 rounded-b-md
                      text-center break-all">
                      {modal.order.adminMessage}
                    </div>
                  </li>
                )
              }

              <li className='w-full flex flex-col justify-center items-center rounded-md mt-1'>
                <div className="bg-blue-100 text-blue-500 w-full p-3 rounded-t-md text-center">
                  آدرس
                </div>
                <div className="bg-white w-full flex justify-center items-center p-3 rounded-b-md
                  text-center break-all">
                  {modal.order.address}
                </div>
              </li>

              <li className='w-full flex flex-col justify-center items-center rounded-md mt-1 '>
                <div className="bg-blue-100 text-blue-500 w-full p-3 rounded-t-md text-center">
                  توضیحات
                </div>
                <div className="bg-white w-full flex justify-center items-center p-3 rounded-b-md
                  text-center break-all">
                  {modal.order.description}
                </div>
              </li>
            </ul>
          </PortalModal>
        )
      }

      {
        (modal.show && showAcceptOrderModal) && (
          <PortalModal
            closeHandler={() => setShowAcceptOrderModal(false)}
            asAlert={true}
          >
            <form className='bg-white w-96 flex flex-col justify-center items-center gap-3 p-6 rounded-xl'>
              <label
                className='text-blue-500 sansbold text-center'
                htmlFor="payment-input"
              >
                آیا می خواهید قبل از تعمیر پیش پرداخت بگیرید؟
              </label>
              <div className='w-full bg-input'>
                <input
                  className='input'
                  type="number"
                  inputMode='decimal'
                  placeholder='قیمت به تومان'
                  ref={paymentAcceptInputRef}
                />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="svg-input">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <label
                className='text-blue-500 sansbold text-center'
              >
                آیا سفارش توضیحات دارد؟
              </label>
              <div className='w-full bg-textarea'>
                <textarea
                  className='textarea'
                  placeholder='توضیحات را وارد کنید'
                  value={orderDesc}
                  onChange={event => setOrderDesc(event.target.value)}
                >
                </textarea>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="svg-textarea">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
              </div>
              <div className="w-full flex justify-center items-center gap-3">
                <SubmitBtn
                  customClass={'w-1/2'}
                  isLoading={paymentOrderStatusLoding.paymentAccept}
                  clickHandler={event => acceptOrderHandler(event, modal.order.id, 'payment-working')}
                >
                  تایید قیمت
                </SubmitBtn>
                <SubmitBtn
                  type={'outline'}
                  customClass={'w-1/2'}
                  isLoading={paymentOrderStatusLoding.accept}
                  clickHandler={event => acceptOrderHandler(event, modal.order.id, 'working')}
                >
                  خیر، ادامه
                </SubmitBtn>
              </div>
            </form>
          </PortalModal>
        )
      }

      {
        (modal.show && showCancelOrderModal) && (
          <PortalModal
            closeHandler={() => setShowCancelOrderModal(false)}
            asAlert={true}
          >
            <form className='bg-white w-96 flex flex-col justify-center items-center gap-3 p-6 rounded-xl'>
              <label
                className='text-blue-500 sansbold text-center'
              >
                آیا سفارش توضیحات دارد؟
              </label>
              <div className='w-full bg-textarea'>
                <textarea
                  className='textarea'
                  placeholder='توضیحات را وارد کنید'
                  value={orderDesc}
                  onChange={event => setOrderDesc(event.target.value)}
                >
                </textarea>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="svg-textarea">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
              </div>
              <SubmitBtn
                type={'danger'}
                customClass={'w-full'}
                isLoading={paymentOrderStatusLoding.cancel}
                clickHandler={event => cancelOrderHandler(event, modal.order.id)}
              >
                لغو سفارش
              </SubmitBtn>
            </form>
          </PortalModal>
        )
      }

      {
        (modal.show && showDoneOrderModal) && (
          <PortalModal
            closeHandler={() => setShowDoneOrderModal(false)}
            asAlert={true}
          >
            <form className='bg-white w-96 flex flex-col justify-center items-center gap-3 p-6 rounded-xl'>
              <label
                className='text-blue-500 sansbold text-center'
                htmlFor="payment-input"
              >
                آیا می خواهید برای اتمام تعمیر هزینه بگیرید؟
              </label>
              <div className='w-full bg-input'>
                <input
                  className='input'
                  type="number"
                  inputMode='decimal'
                  placeholder='قیمت به تومان'
                  ref={paymentDoneInputRef}
                />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="svg-input">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <label
                className='text-blue-500 sansbold text-center'
              >
                آیا سفارش توضیحات دارد؟
              </label>
              <div className='w-full bg-textarea'>
                <textarea
                  className='textarea'
                  placeholder='توضیحات را وارد کنید'
                  value={orderDesc}
                  onChange={event => setOrderDesc(event.target.value)}
                >
                </textarea>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="svg-textarea">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
              </div>
              <div className="w-full flex justify-center items-center gap-3">
                <SubmitBtn
                  customClass={'w-1/2'}
                  isLoading={paymentOrderStatusLoding.paymentAccept}
                  clickHandler={event => doneOrderHandler(event, modal.order.id, 'payment-done')}
                >
                  تایید قیمت
                </SubmitBtn>
                <SubmitBtn
                  type={'outline'}
                  customClass={'w-1/2'}
                  isLoading={paymentOrderStatusLoding.accept}
                  clickHandler={event => doneOrderHandler(event, modal.order.id, 'done')}
                >
                  خیر، ادامه
                </SubmitBtn>
              </div>
            </form>
          </PortalModal>
        )
      }

      <Toaster />
    </>
  )
}

export default AdminOrders