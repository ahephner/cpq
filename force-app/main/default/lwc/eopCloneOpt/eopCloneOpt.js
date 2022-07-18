import { LightningElement, api } from 'lwc';
import { CloseActionScreenEvent } from 'lightning/actions';
import { NavigationMixin } from 'lightning/navigation';
import eopClone from '@salesforce/apex/cpqOppClone.cloneOppEOP';
export default class EopCloneOpt extends NavigationMixin(LightningElement) {
    @api recordId; 
    loaded = true;
    value;
    get options(){
        return [
            {label: 'Yes', value:'Yes'},
            {label:'No', value:'No'}
        ]
    }
    handleChange(event){
        console.log(this.recordId)
        this.value = event.detail.value
    }

    save(){
        //need to validate soon
        let valid = this.isValid();
        this.loaded = false;  
        if(valid){
            eopClone({recId: this.recordId, EOP: this.value})
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
}