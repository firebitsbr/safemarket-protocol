const contracts = require('./contracts')
const Q = require('q')
const ultralightbeam = require('./ultralightbeam')
const accounts = require('./accounts')
const Amorph = require('./Amorph')
const random = require('random-amorph')
const planetoidPromise = require('./planetoid')
const planetoidUtils = require('planetoid-utils')

const deferred = Q.defer()

module.exports = deferred.promise

describe('StoreReg', () => {

  const meta = random(Amorph, 120)
  let planetoid
  let storeReg
  let user

  before(() => {
    return planetoidPromise.then((_planetoid) => {
      planetoid = _planetoid
    })
  })

  after(() => {
    deferred.resolve(storeReg)
  })

  it('should instantiate', () => {
    return ultralightbeam.solDeploy(contracts.StoreReg.code, contracts.StoreReg.abi, [], {}).then((_storeReg) => {
      storeReg = _storeReg
    })
  })

  it('should set planetoid', () => {
    return storeReg.broadcast('setPlanetoid(address)', [planetoid.address], {}).getConfirmation()
  })

  it('planetoid should be correct', () => {
    return storeReg.fetch('planetoid()', []).should.eventually.amorphEqual(planetoid.address)
  })

  it('cannot register a blank storeId', () => {
    return storeReg.broadcast('register(bytes32,bytes)', [new Amorph('', 'ascii'), meta], {}).getConfirmation().should.be.rejectedWith(Error)
  })

  it('cannot register an storeId with an uppercase letter', () => {
    return storeReg.broadcast('register(bytes32,bytes)', [new Amorph('myAlias', 'ascii'), meta], {}).getConfirmation().should.be.rejectedWith(Error)
  })

  it('cannot register an storeId with an space', () => {
    return storeReg.broadcast('register(bytes32,bytes)', [new Amorph('my storeId', 'ascii'), meta], {}).getConfirmation().should.be.rejectedWith(Error)
  })

  it('cannot register an storeId with a middle 0x00', () => {
    return storeReg.broadcast('register(bytes32,bytes)', [new Amorph('300030', 'hex'), meta], {}).getConfirmation().should.be.rejectedWith(Error)
  })

  it('can register "az_019"', () => {
    return storeReg.broadcast('register(bytes32,bytes)', [new Amorph('az_019', 'ascii'), meta], {}).getConfirmation()
  })

  it('can register "mystoreid"', () => {
    return storeReg.broadcast('register(bytes32,bytes)', [new Amorph('mystoreid', 'ascii'), meta], {}).getConfirmation()
  })

  it('can NOT re-register "mystoreid"', () => {
    return storeReg.broadcast('register(bytes32,bytes)', [new Amorph('mystoreid', 'ascii'), meta], {}).getConfirmation().should.be.rejectedWith(Error)
  })

  it('can retreive user associated with "mystoreid"', () => {
    return storeReg.fetch('stores(bytes32)', [
      new Amorph('mystoreid', 'ascii')
    ]).then((_user) => {
      user = _user
    })
  })

  it('user should be correct', () => {
    user.owner.should.amorphEqual(accounts.default.address)
  })

  it('should be able to get meta from planteoid', () => {
    return planetoid.fetch('records(bytes32)', [user.metaHash]).then((_record) => {
      const record = planetoidUtils.unmarshalRecord(_record)
      return planetoid.fetch('documents(bytes32)', [record.documentHash]).then((_meta) => {
        meta.should.amorphEqual(_meta)
      })
    })
  })

})
