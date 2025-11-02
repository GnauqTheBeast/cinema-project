import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaCopy, FaWallet, FaCheck } from 'react-icons/fa'
import { ethers } from 'ethers'
import Header from '../../components/Header'
import { bookingService } from '../../services/bookingService'

// Helper function to get booking code without hyphens (bank transfer compatible)
const getBankTransferCode = (bookingId) => {
  return bookingId.replace(/-/g, '').toUpperCase()
}

const PaymentPage = () => {
  const { bookingId } = useParams()
  const navigate = useNavigate()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState('vnd') // 'vnd' or 'crypto'

  // Crypto state
  const [walletAddress, setWalletAddress] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [cryptoAmount, setCryptoAmount] = useState(0)
  const [isPaying, setIsPaying] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [ethUsdPrice, setEthUsdPrice] = useState(0)
  const [vndUsdRate, setVndUsdRate] = useState(0)
  const [loadingPrice, setLoadingPrice] = useState(true)

  // Contract config (replace with your actual contract)
  const PAYMENT_RECEIVER = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' // Your wallet address

  useEffect(() => {
    fetchBooking()
    fetchCryptoPrices()
  }, [bookingId])

  useEffect(() => {
    // Check if wallet is already connected
    checkWalletConnection()
  }, [])

  useEffect(() => {
    // Recalculate crypto amount when prices are fetched
    if (booking && ethUsdPrice && vndUsdRate) {
      const usdAmount = booking.total_amount * vndUsdRate
      const ethAmount = usdAmount / ethUsdPrice
      setCryptoAmount(ethAmount)
      console.log('Updated crypto amount:', ethAmount, 'ETH (Price:', ethUsdPrice, 'USD)')
    }
  }, [booking, ethUsdPrice, vndUsdRate])

  const fetchBooking = async () => {
    try {
      setLoading(true)

      console.log('Fetching booking with ID:', bookingId)

      const bookingResponse = await bookingService.getBookingById(bookingId)

      console.log('Booking response:', bookingResponse)

      // Backend returns {code, message, data}, not {success, data}
      if (!bookingResponse.data || bookingResponse.code !== 200) {
        const errorMsg = bookingResponse.message || 'Không tìm thấy booking'
        console.error('Booking not found:', errorMsg)
        setError(errorMsg)
        return
      }

      setBooking(bookingResponse.data)

      // IMPORTANT: Create payment record in database before showing QR code
      // This ensures SePay webhook can find the payment when user completes transfer
      try {
        const paymentApiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'
        const token = localStorage.getItem('token')

        const paymentResponse = await fetch(`${paymentApiUrl}/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            booking_id: bookingId,
            amount: bookingResponse.data.total_amount,
          }),
        })

        if (!paymentResponse.ok) {
          throw new Error('Failed to create payment record')
        }

        const paymentData = await paymentResponse.json()
        console.log('Payment record created:', paymentData)
      } catch (paymentErr) {
        console.error('Error creating payment:', paymentErr)
        // Continue anyway - QR code will still work, but might need manual verification
        alert('Cảnh báo: Không thể tạo payment record. Vui lòng liên hệ admin nếu thanh toán không được tự động xác nhận.')
      }

      // Generate QR code URL (client-side only, no API call needed)
      const acc = '51020036688'
      const bank = 'MBBANK'
      const bankCode = getBankTransferCode(bookingId)
      const des = `QH${bankCode}` // UUID without hyphens - bank transfer compatible
      const amount = Math.round(bookingResponse.data.total_amount)
      const qrUrl = `https://qr.sepay.vn/img?acc=${acc}&bank=${bank}&amount=${amount}&des=${des}`
      setQrCodeUrl(qrUrl)

      console.log('QR URL generated:', qrUrl)

    } catch (err) {
      console.error('Error fetching booking:', err)
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      })

      const errorMsg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tải dữ liệu'
      setError(`Lỗi: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchCryptoPrices = async () => {
    try {
      setLoadingPrice(true)

      // Fetch ETH/USD price from CoinGecko
      const ethResponse = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      )
      const ethData = await ethResponse.json()
      const ethPrice = ethData.ethereum.usd
      setEthUsdPrice(ethPrice)

      // Fetch VND/USD rate from Exchange Rate API
      const vndResponse = await fetch(
        'https://api.exchangerate-api.com/v4/latest/USD'
      )
      const vndData = await vndResponse.json()
      const vndRate = 1 / vndData.rates.VND // USD per VND
      setVndUsdRate(vndRate)

      console.log('Fetched prices:', { ethPrice, vndRate })
    } catch (err) {
      console.error('Error fetching crypto prices:', err)
      // Fallback to default values
      setEthUsdPrice(2000)
      setVndUsdRate(0.000040)
    } finally {
      setLoadingPrice(false)
    }
  }

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()
        if (accounts.length > 0) {
          setWalletAddress(accounts[0].address)
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err)
      }
    }
  }

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask to use crypto payment!')
      window.open('https://metamask.io/download/', '_blank')
      return
    }

    try {
      setIsConnecting(true)
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      setWalletAddress(address)
      console.log('Wallet connected:', address)
    } catch (err) {
      console.error('Error connecting wallet:', err)
      alert('Failed to connect wallet: ' + err.message)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setWalletAddress('')
  }

  const handleCryptoPayment = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet first!')
      return
    }

    try {
      setIsPaying(true)

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // Send transaction
      const tx = await signer.sendTransaction({
        to: PAYMENT_RECEIVER,
        value: ethers.parseEther(cryptoAmount.toFixed(6)),
        data: ethers.hexlify(ethers.toUtf8Bytes(`QH-${bookingId}`)),
      })

      console.log('Transaction sent:', tx.hash)
      alert(`Transaction sent! Hash: ${tx.hash}`)

      // Wait for confirmation
      const receipt = await tx.wait()
      console.log('Transaction confirmed:', receipt)

      // Submit transaction to backend for verification
      try {
        const verifyResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'}/payments/crypto/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            booking_id: bookingId,
            tx_hash: tx.hash,
            from_address: walletAddress,
            to_address: PAYMENT_RECEIVER,
            amount_eth: cryptoAmount.toFixed(6),
            amount_vnd: booking.total_amount,
            network: 'ethereum',
          }),
        })

        if (!verifyResponse.ok) {
          throw new Error('Backend verification failed')
        }

        console.log('Backend verification successful')
      } catch (verifyErr) {
        console.error('Error verifying with backend:', verifyErr)
        // Continue anyway - transaction was successful on chain
      }

      setPaymentSuccess(true)
      alert('Payment successful! Transaction confirmed.')

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/booking-success')
      }, 2000)

    } catch (err) {
      console.error('Error sending payment:', err)
      alert('Payment failed: ' + err.message)
    } finally {
      setIsPaying(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Đã sao chép!')
  }

  const shortenAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-300"
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <div className="bg-gray-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300"
            >
              <FaArrowLeft />
              Quay lại
            </button>
            <h1 className="text-xl font-semibold text-white">Thanh toán</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Payment Method Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setPaymentMethod('vnd')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors duration-300 ${
              paymentMethod === 'vnd'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Chuyển khoản VND
          </button>
          <button
            onClick={() => setPaymentMethod('crypto')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors duration-300 flex items-center justify-center gap-2 ${
              paymentMethod === 'crypto'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <FaWallet /> Thanh toán Crypto
          </button>
        </div>

        <div className="bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-800">
          {paymentSuccess && (
            <div className="mb-6 p-4 bg-green-900/50 border border-green-600 rounded-lg flex items-center gap-3">
              <FaCheck className="text-green-400 text-2xl" />
              <div>
                <p className="text-green-400 font-semibold">Thanh toán thành công!</p>
                <p className="text-gray-300 text-sm">Đang chuyển hướng...</p>
              </div>
            </div>
          )}

          {/* VND Payment */}
          {paymentMethod === 'vnd' && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Quét mã QR để thanh toán</h2>
                <p className="text-gray-400">Vui lòng chuyển khoản theo thông tin bên dưới</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-semibold text-white mb-4">Mã QR thanh toán</h3>
                  <div className="bg-white p-4 rounded-lg">
                    <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                  </div>
                  <p className="text-sm text-gray-400 mt-4 text-center">
                    Quét mã QR bằng app ngân hàng để thanh toán
                  </p>
                </div>

                {/* Bank Transfer Info */}
                <div className="flex flex-col justify-center">
                  <h3 className="text-lg font-semibold text-white mb-4">Thông tin chuyển khoản</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Ngân hàng</p>
                      <div className="flex justify-between items-center">
                        <p className="text-white font-semibold">MB Bank (MBBANK)</p>
                        <button
                          onClick={() => copyToClipboard('MBBANK')}
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          <FaCopy /> Sao chép
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Số tài khoản</p>
                      <div className="flex justify-between items-center">
                        <p className="text-white font-semibold">51020036688</p>
                        <button
                          onClick={() => copyToClipboard('51020036688')}
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          <FaCopy /> Sao chép
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Số tiền</p>
                      <div className="flex justify-between items-center">
                        <p className="text-red-400 font-bold text-xl">
                          {formatPrice(booking?.total_amount)}
                        </p>
                        <button
                          onClick={() => copyToClipboard(Math.round(booking?.total_amount).toString())}
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          <FaCopy /> Sao chép
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg border-2 border-yellow-600">
                      <p className="text-sm text-gray-400 mb-1">Nội dung chuyển khoản</p>
                      <div className="flex justify-between items-center">
                        <p className="text-yellow-400 font-bold">QH{getBankTransferCode(bookingId)}</p>
                        <button
                          onClick={() => copyToClipboard(`QH${getBankTransferCode(bookingId)}`)}
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          <FaCopy /> Sao chép
                        </button>
                      </div>
                      <p className="text-xs text-yellow-500 mt-2">
                        ⚠️ Vui lòng nhập chính xác nội dung để hệ thống tự động xác nhận thanh toán
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Crypto Payment */}
          {paymentMethod === 'crypto' && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Thanh toán bằng Cryptocurrency</h2>
                <p className="text-gray-400">Kết nối ví MetaMask để thanh toán</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                {/* Wallet Connection */}
                {!walletAddress ? (
                  <div className="text-center">
                    <button
                      onClick={connectWallet}
                      disabled={isConnecting}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center gap-3 mx-auto transition-colors duration-300"
                    >
                      <FaWallet className="text-2xl" />
                      {isConnecting ? 'Đang kết nối...' : 'Kết nối ví MetaMask'}
                    </button>
                    <p className="text-gray-400 text-sm mt-4">
                      Bạn cần cài đặt MetaMask extension để sử dụng tính năng này
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Connected Wallet */}
                    <div className="bg-gray-800 p-6 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-400">Ví đã kết nối</p>
                        <button
                          onClick={disconnectWallet}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Ngắt kết nối
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <FaWallet className="text-white" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{shortenAddress(walletAddress)}</p>
                          <p className="text-gray-400 text-xs">Ethereum Mainnet</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Amount */}
                    <div className="bg-gray-800 p-6 rounded-lg">
                      <p className="text-sm text-gray-400 mb-2">Số tiền thanh toán</p>
                      {loadingPrice ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <p className="text-gray-400">Đang tải giá...</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-3">
                            <p className="text-3xl font-bold text-white">{cryptoAmount.toFixed(6)} ETH</p>
                            <p className="text-gray-400">≈ {formatPrice(booking?.total_amount)}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Tỷ giá: 1 ETH = ${ethUsdPrice.toLocaleString()}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Payment Details */}
                    <div className="bg-gray-800 p-6 rounded-lg space-y-3">
                      <div className="flex justify-between">
                        <p className="text-gray-400">Địa chỉ nhận</p>
                        <p className="text-white font-mono text-sm">{shortenAddress(PAYMENT_RECEIVER)}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-gray-400">Network</p>
                        <p className="text-white">Ethereum Mainnet</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-gray-400">Transaction Data</p>
                        <p className="text-yellow-400 font-semibold">QH-{bookingId}</p>
                      </div>
                    </div>

                    {/* Pay Button */}
                    <button
                      onClick={handleCryptoPayment}
                      disabled={isPaying || paymentSuccess}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 text-white py-4 rounded-lg font-bold text-lg transition-all duration-300"
                    >
                      {isPaying ? 'Đang xử lý...' : paymentSuccess ? 'Đã thanh toán' : 'Xác nhận thanh toán'}
                    </button>

                    <p className="text-center text-sm text-gray-400">
                      ⚠️ Vui lòng kiểm tra kỹ thông tin trước khi thanh toán. Giao dịch blockchain không thể hoàn tác.
                    </p>
                  </>
                )}
              </div>
            </>
          )}

          {/* Booking Info */}
          {booking && (
            <div className="mt-8 pt-8 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Thông tin đặt vé</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Mã booking</p>
                  <p className="text-white font-semibold">{booking.id}</p>
                </div>
                <div>
                  <p className="text-gray-400">Tổng tiền</p>
                  <p className="text-red-400 font-bold">{formatPrice(booking.total_amount)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Trạng thái</p>
                  <p className="text-yellow-400 font-semibold capitalize">{booking.status}</p>
                </div>
                <div>
                  <p className="text-gray-400">Thời gian tạo</p>
                  <p className="text-white font-semibold">
                    {new Date(booking.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PaymentPage
