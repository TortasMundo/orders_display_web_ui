import React, {Component} from 'react'
import './App.css'
import config from './config'
import * as orderService from './services/orders'
import io from 'socket.io-client'
import ReactSound from 'react-sound'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      orders: [],
      currentOrderIndex: 0,
      ring: false,
    }
    this.socket = {}
  }

  async componentDidMount() {
    this.socket = io(config.API_URL)
    this.socket.emit('subscribe_for_order_placements', config.mocks.store_location)
    this.socket.on('placed_order', order => {
      this.setState({
        ring: true,
        orders: [...this.state.orders, order],
      })
      if (
        this.state.currentOrderIndex === this.state.orders.length - 2 &&
        this.state.orders[this.state.currentOrderIndex].status !== 'ORDERED'
      ) {
        this.setState({
          currentOrderIndex: Math.min(
            this.state.currentOrderIndex + 1,
            this.state.orders.length - 1,
          ),
        })
      }
    })

    const response = await orderService.listOrders()
    if (response.data && response.data.length) {
      this.setState({ orders: response.data })
    }
  }

  navigate = async e => {
    if (e.keyCode === 13) {
      orderService.updateStatus(this.state.orders[this.state.currentOrderIndex].code, 'COOKED')
      this.state.orders[this.state.currentOrderIndex].status = 'DELIVERING'
      this.setState({
        ring: false,
        currentOrderIndex: Math.min(this.state.currentOrderIndex + 1, this.state.orders.length - 1),
      })
    }
    if (e.keyCode === 39) {
      const nextIndex = Math.min(this.state.currentOrderIndex + 1, this.state.orders.length - 1)
      if (
        this.state.orders[this.state.currentOrderIndex].status !== 'ORDERED' ||
        this.state.orders[nextIndex].status !== 'ORDERED'
      ) {
        this.setState({
          ring: false,
          currentOrderIndex: nextIndex,
        })
      }
    }
    if (e.keyCode === 37) {
      this.setState({
        ring: false,
        currentOrderIndex: Math.max(this.state.currentOrderIndex - 1, 0),
      })
    }
  }

  render() {
    if (!this.state.orders || !this.state.orders.length) return null
    const dayTotal = this.state.orders.map(o => Number(o.total)).reduce((acc, val) => acc + val)
    const commission = dayTotal * 0.05
    const cookedClass =
      this.state.orders[this.state.currentOrderIndex].status !== 'ORDERED' ? 'Cooked' : ''
    return (
      <div className="App" onKeyDown={this.navigate} tabIndex="0">
        <div className={`Header ${cookedClass}`}>
            <div className={`OrderNo`}>
              #{this.state.currentOrderIndex + 1}
            </div>
          <div className={`Notes`}>
            {this.state.orders[this.state.currentOrderIndex].notes}
          </div>
        </div>
        <div className={`Info ${cookedClass}`}>
          <div className="OrderDetails">
            * Jamón - {this.state.orders[this.state.currentOrderIndex].jamon_quantity} <br/>* Lomo -{' '}
            {this.state.orders[this.state.currentOrderIndex].lomo_quantity} <br/>* Especial -{' '}
            {this.state.orders[this.state.currentOrderIndex].especial_quantity} <br/>* Refrescos -{' '}
            {this.state.orders[this.state.currentOrderIndex].refrescos_quantity} <br/>
          </div>
          <div className="Totals">
            Total orden: <br/>${this.state.orders[this.state.currentOrderIndex].total}
            <br/>
            <br/>
            Total día: <br/>${dayTotal}
            <br/>
            <br/>
            Comisión: <br/>${commission}
          </div>
        </div>
        {this.state.ring && <ReactSound url="sound.mp3" playStatus={ReactSound.status.PLAYING}/>}
      </div>
    )
  }

  componentWillUnmount() {
    this.socket.disconnect()
  }
}

export default App
