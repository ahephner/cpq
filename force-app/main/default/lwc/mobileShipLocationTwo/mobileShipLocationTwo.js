import { LightningElement, api, track } from 'lwc';

export default class MobileShipLocationTwo extends LightningElement{
    mess;
    shipOptions;
    option
    selectedObj;
    selectedAddress;
    @api prevSelAddress;
    @api productTotal; 
    @api customer;
    @api shOptions  
    connectedCallback(){
        if(this.shOptions && this.prevSelAddress){
            this.selectedObj = this.shOptions.find(x => x.Id === this.prevSelAddress);
        }
        this.shipOptions = this.shOptions; 
        console.log(1, JSON.stringify(this.shipOptions));
        
    }
    selectChange(){
        let newValue = this.template.querySelector('.slds-select').value;
        console.log(newValue);
        
        if(newValue === 'new'){
            this.template.querySelector('c-new-ship-address').openAddress(); 
        }else{
            this.selectedAddress = newValue;
            
        }
    }
    

    updateAddress(event){
        //console.log('ship options '+JSON.stringify(this.shipOptions))
        let Id = event.detail.value;
        let Name = event.detail.label;
        let newVal = {Id, Name}
        //console.log(newVal);
        
       this.shipOptions = [...this.shipOptions, newVal]
    //    console.log('ship options '+JSON.stringify(this.shipOptions))
    }

    saveSubmit(){
        if(!this.selectedAddress || this.selectedAddress ===''){
            alert('add shipping address')
            return; 
        }
        this.mess = 'submit';
        this.handleNext();
    }

    handleReturn(){
        this.mess = 'return';
        this.handleNext();
    }

    handleNext(){
        let info = {message: this.mess, shipId: this.selectedAddress};
        this.dispatchEvent(new CustomEvent('handleshipback',{
            detail: info
        }))
    }
}