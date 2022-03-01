import { LightningElement, api, track } from 'lwc';

export default class MobileShipLocationTwo extends LightningElement{
    mess;
    shipOptions;
    option
    selectedObj;
    @api prevSelAddress;
    @api productTotal; 
    @api customer;  
    connectedCallback(){
        console.log(this.customer);
        
    }
    selectChange(){
        let newValue = this.template.querySelector('.slds-select').value;
        if(newValue === 'new'){
            this.template.querySelector('c-new-ship-address').openAddress(); 
        }else{
            this.selectedOption = newValue;
            
            const attChange = new FlowAttributeChangeEvent('selectedOpton', this.selectedOption);
            this.dispatchEvent(attChange);
        }
    }
    handleReturn(){
        this.mess = 'return';
        this.handleNext();
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
        if(!this.selectedOption || this.selectedOption ===''){
            alert('add shipping address')
            return; 
        }
        this.mess = 'submit';
        this.handleNext();
    }

    getQuote(){
        
        this.mess = 'quote'
        this.handleNext(); 
    }

    handleNext(){
        console.log('trying to send ')
        this.dispatchEvent('handleshipback',{
            detail: this.mess
        })
    }
}