import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaCreditCard, FaMobile, FaQrcode, FaShieldAlt, FaCheckCircle, FaBitcoin } from 'react-icons/fa'
import Header from '../../components/Header'

const PaymentPage = () => {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  
  const [selectedMethod, setSelectedMethod] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [cryptoAddress, setCryptoAddress] = useState('')
  const [selectedCrypto, setSelectedCrypto] = useState('BTC')
  const [isProcessing, setIsProcessing] = useState(false)

  const paymentMethods = [
    {
      id: 'credit_card',
      name: 'Thẻ tín dụng/ghi nợ',
      icon: FaCreditCard,
      description: 'Visa, Mastercard, JCB'
    },
    {
      id: 'momo',
      name: 'Ví MoMo',
      icon: FaMobile,
      description: 'Thanh toán qua ví điện tử'
    },
    {
      id: 'qr_code',
      name: 'Quét mã QR',
      icon: FaQrcode,
      description: 'Quét mã QR để thanh toán'
    },
    {
      id: 'crypto',
      name: 'Tiền điện tử',
      icon: FaBitcoin,
      description: 'Bitcoin, Ethereum, USDT'
    }
  ]

  const cryptoOptions = [
    { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', rate: 0.0000012 },
    { id: 'ETH', name: 'Ethereum', symbol: 'ETH', rate: 0.000018 },
    { id: 'USDT', name: 'Tether', symbol: 'USDT', rate: 1 }
  ]

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value)
    setCardNumber(formatted)
  }

  const handleExpiryDateChange = (e) => {
    const formatted = formatExpiryDate(e.target.value)
    setExpiryDate(formatted)
  }

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/gi, '')
    if (value.length <= 4) {
      setCvv(value)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedMethod) {
      alert('Vui lòng chọn phương thức thanh toán')
      return
    }

    if (selectedMethod === 'crypto' && !cryptoAddress) {
      alert('Vui lòng nhập địa chỉ ví của bạn')
      return
    }

    setIsProcessing(true)
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      if (selectedMethod === 'crypto') {
        alert('Yêu cầu thanh toán đã được gửi! Vui lòng chuyển tiền theo hướng dẫn và chờ xác nhận.')
      } else {
        alert('Thanh toán thành công!')
      }
      navigate('/profile')
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      {/* Page Header */}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800">
              <h2 className="text-2xl font-bold text-white mb-6">Phương thức thanh toán</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Payment Methods */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Chọn phương thức thanh toán</h3>
                  {paymentMethods.map((method) => {
                    const Icon = method.icon
                    return (
                      <label
                        key={method.id}
                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                          selectedMethod === method.id
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={selectedMethod === method.id}
                          onChange={(e) => setSelectedMethod(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-lg ${
                            selectedMethod === method.id ? 'bg-red-600' : 'bg-gray-700'
                          }`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{method.name}</h4>
                            <p className="text-gray-400 text-sm">{method.description}</p>
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>

                {/* Credit Card Form */}
                {selectedMethod === 'credit_card' && (
                  <div className="space-y-6 p-6 bg-gray-800 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-white">Thông tin thẻ</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Số thẻ
                        </label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Ngày hết hạn
                        </label>
                        <input
                          type="text"
                          value={expiryDate}
                          onChange={handleExpiryDateChange}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={cvv}
                          onChange={handleCvvChange}
                          placeholder="123"
                          maxLength={4}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Tên chủ thẻ
                        </label>
                        <input
                          type="text"
                          value={cardholderName}
                          onChange={(e) => setCardholderName(e.target.value)}
                          placeholder="NGUYEN VAN A"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* MoMo Form */}
                {selectedMethod === 'momo' && (
                  <div className="space-y-6 p-6 bg-gray-800 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-white">Thông tin ví MoMo</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="0123 456 789"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {/* QR Code Form */}
                {selectedMethod === 'qr_code' && (
                  <div className="space-y-6 p-6 bg-gray-800 rounded-lg border border-gray-700 text-center">
                    <h3 className="text-lg font-semibold text-white">Quét mã QR để thanh toán</h3>
                    
                    <div className="bg-white p-6 rounded-lg inline-block">
                      <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                        <FaQrcode className="w-24 h-24 text-gray-400" />
                      </div>
                    </div>
                    
                    <p className="text-gray-400 text-sm">
                      Sử dụng ứng dụng ngân hàng để quét mã QR và hoàn tất thanh toán
                    </p>
                  </div>
                )}

                {/* Crypto Form */}
                {selectedMethod === 'crypto' && (
                  <div className="space-y-6 p-6 bg-gray-800 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-white">Thanh toán bằng tiền điện tử</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Chọn loại tiền điện tử
                        </label>
                        <select
                          value={selectedCrypto}
                          onChange={(e) => setSelectedCrypto(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          {cryptoOptions.map((crypto) => (
                            <option key={crypto.id} value={crypto.id}>
                              {crypto.name} ({crypto.symbol})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-300">Số tiền cần thanh toán:</span>
                          <span className="text-white font-semibold">200.000₫</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Tương đương:</span>
                          <span className="text-red-400 font-semibold">
                            {cryptoOptions.find(c => c.id === selectedCrypto)?.rate * 200000} {selectedCrypto}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Địa chỉ ví của bạn
                        </label>
                        <input
                          type="text"
                          value={cryptoAddress}
                          onChange={(e) => setCryptoAddress(e.target.value)}
                          placeholder="Nhập địa chỉ ví của bạn"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>

                      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                        <h4 className="text-yellow-400 font-medium mb-2">Hướng dẫn thanh toán:</h4>
                        <ol className="text-yellow-300 text-sm space-y-1 list-decimal list-inside">
                          <li>Chuyển {cryptoOptions.find(c => c.id === selectedCrypto)?.rate * 200000} {selectedCrypto} đến địa chỉ: <code className="bg-gray-800 px-2 py-1 rounded text-xs">1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T</code></li>
                          <li>Ghi chú giao dịch: {bookingId}</li>
                          <li>Chờ xác nhận (thường mất 10-30 phút)</li>
                          <li>Vé sẽ được gửi đến email của bạn</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Notice */}
                <div className="flex items-start space-x-3 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                  <FaShieldAlt className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-blue-400 font-medium text-sm">Bảo mật thanh toán</h4>
                    <p className="text-blue-300 text-sm mt-1">
                      Thông tin thanh toán của bạn được mã hóa và bảo mật. Chúng tôi không lưu trữ thông tin thẻ của bạn.
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-4 px-6 rounded-lg font-semibold transition-colors duration-300 flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      <span>Xác nhận thanh toán</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-xl shadow-lg p-6 sticky top-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Tóm tắt đơn hàng</h3>
              
              {/* Movie Info */}
              <div className="mb-4">
                <img
                  src="https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg"
                  alt="Movie Poster"
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
                <h4 className="font-medium text-white">Avengers: Endgame</h4>
                <p className="text-gray-400 text-sm">Phòng 1 - 19:00, 15/01/2025</p>
              </div>

              {/* Seats */}
              <div className="space-y-2 mb-4">
                <h4 className="font-medium text-white">Ghế đã chọn:</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">A01 - Thường</span>
                    <span className="text-red-400">50.000₫</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">A02 - Thường</span>
                    <span className="text-red-400">50.000₫</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">M01 - Đôi</span>
                    <span className="text-red-400">100.000₫</span>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-white">Tổng cộng:</span>
                  <span className="text-red-400">200.000₫</span>
                </div>
              </div>

              {/* Payment Method Display */}
              {selectedMethod && (
                <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-400">Phương thức thanh toán:</p>
                  <p className="text-white font-medium">
                    {paymentMethods.find(m => m.id === selectedMethod)?.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage
