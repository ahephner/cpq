import { LightningElement, api } from 'lwc';
import { CloseActionScreenEvent } from 'lightning/actions';
import { NavigationMixin } from 'lightning/navigation';
import FORM_FACTOR from '@salesforce/client/formFactor';
import eopClone from '@salesforce/apex/cpqOppClone.cloneOppEOP';
import getPickListValues from '@salesforce/apex/lwcHelper.getPickListValues';
export default class EopCloneOpt extends NavigationMixin(LightningElement) {
    @api recordId; 
    loaded = true;
    value;
    formSize; 
    options; 
    connectedCallback() {
      this.formSize = this.screenSize(FORM_FACTOR); 
      this.findOrderType();  
    }
        //check screen size to show table on desktop and cards on mobile
    screenSize = (screen) => {
        return screen === 'Large'? true : false
    }
    shipOptions
    findOrderType(){
         getPickListValues({objName: 'Opportunity', fieldAPI:'Order_Type__c'})
            .then((x)=>{
                    this.options = x;   
            })
    }
    handleChange(event){
        this.value = event.detail.value
        
    }

    save(){
        //need to validate soon
        let valid = this.isValid();
        this.loaded = false;  
        if(valid){
            window.clearTimeout(this.delay);
            this.delay = setTimeout(() => {
                console.log('waiting ', this.value);
                
            }, 2000);
            eopClone({recId: this.recordId, orderType: this.value})
                .then((res)=>{

                    this[NavigationMixin.Navigate]({
                        type: 'standard__recordPage',
                        attributes: {
                            recordId: res,
                            objectApiName: 'Opportunity',
                            actionName: 'view'
                        }
                    });
                    this.loaded = true;
                }).catch((error)=>{
                    this.loaded  = true;
                    console.log(2, JSON.parse(JSON.stringify(error)))
                })
        }else{
            this.loaded = true;
        }
    }

    cancel(){
        this.dispatchEvent(new CloseActionScreenEvent());
    }

    isValid(){
        let valid = true; 
        const input = this.template.querySelectorAll('lightning-combobox');
        input.forEach(x =>{
            if(!x.checkValidity()){
                x.reportValidity();
                valid = false;
            }
        })
        return valid; 
    }

    mCancel(){
        this.dispatchEvent(new CustomEvent('close'));
    }

    // mSave(){
    //     this.save(); 
    // }
}