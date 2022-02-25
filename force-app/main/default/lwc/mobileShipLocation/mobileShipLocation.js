import { LightningElement, api, track } from 'lwc';
import { FlowNavigationNextEvent,FlowAttributeChangeEvent, FlowNavigationBackEvent  } from 'lightning/flowSupport';
export default class MobileButtonGroup extends LightningElement {
    @api moveTo;
    mess;
    shipOptions;
    option
    selectedObj
    @api selectedOption;
    @api prevSelected; 
    @api customer
    @api 
    get addresses(){
        return this.shipOptions || [];
    }
    set addresses(data){
        this.shipOptions = data; 
    }
    connectedCallback(){
        if(this.shipOptions && this.prevSelected){
            console.log('call back');
            
            this.selectedObj =this.shipOptions.find(x => x.Id === this.prevSelected);
            this.selectedOption = this.selectedObj.Id; 
            
        }
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
        const attChange = new FlowAttributeChangeEvent('moveTo', this.mess);
        this.dispatchEvent(attChange);
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
        const attChange = new FlowAttributeChangeEvent('moveTo', this.mess);
        this.dispatchEvent(attChange);
        this.handleNext();
    }

    getQuote(){
        this.mess = 'quote';
        const attChange = new FlowAttributeChangeEvent('moveTo', this.mess);
        this.dispatchEvent(attChange);
        this.handleNext(); 
    }

    handleNext(){
        const nextNav = new FlowNavigationNextEvent();
        this.dispatchEvent(nextNav);
    }
}