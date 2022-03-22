import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue, updateRecord } from 'lightning/uiRecordApi';
import { CloseActionScreenEvent } from 'lightning/actions';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAddress from '@salesforce/apex/cpqApex.getAddress'
import SHIPTO from '@salesforce/schema/Opportunity.Shipping_Address__c';
import ACCID from '@salesforce/schema/Opportunity.AccountId';
import STAGE from '@salesforce/schema/Opportunity.StageName';
import ID_Field from '@salesforce/schema/Opportunity.Id';
const FIELDS = [SHIPTO, ACCID]
export default class CreateQuoteDesktop extends LightningElement { 
    @api recordId
    stage = 'Quote';
    accountId; 
    shipTo; 
    info = true;
    loaded = false; 
    options;
    error; 
    @wire(getRecord,{recordId: '$recordId', fields:FIELDS})
        loadFields({data,error}){
            if(data){
                this.shipTo = getFieldValue(data, SHIPTO); 
                this.accountId = getFieldValue(data, ACCID);
                if(this.shipTo === null){ 
                    this.findAddress(this.accountId);
                    this.loaded = true; 
                }else{ 
                    this.handleSave(); 
                }
                
            }else if(error){
                let err = JSON.stringify(error);
                alert(err)
            }
        }

        //get address stuff
    //get the avaliable ship to options
    findAddress(rec){
        console.log('finding '+rec)
        getAddress({accID: rec})
           .then((res)=>{
               JSON.stringify(res)
               this.options = res.map(item=>({
                                   ...item,
                                   label: item.Street +' ('+item.Name+')',
                                   value: item.Id
               }))
               // console.log('type of options '+typeof this.options);
               // console.log(JSON.stringify(this.options))
           }).catch((error)=>{
               this.error = error;
               console.log('error  '+this.error);
               
           }).finally(()=>{
           
           })
   }
   get selectedObj(){
    let label;
    
        if(this.options && this.shipTo){
            label = this.options.find((x)=>x.value===this.shipTo)
        }
        
        return label;   
}
//Change Sections
//new Ship Address
selectChange(event){
    let newValue = this.template.querySelector('.slds-select').value;
    if(newValue === "new"){ 
        this.info = false; 
    }else{
        this.shipTo = newValue;
        console.log('new ship to '+this.shipTo);
        
    }
}

handleCancel(){ 
    this.dispatchEvent(new CloseActionScreenEvent());
}

handleSave(){ 
    this.loaded = false;
    const fields = {}

            fields[STAGE.fieldApiName] = this.stage;
            fields[SHIPTO.fieldApiName] = this.shipTo;
            fields[ID_Field.fieldApiName] = this.recordId; 
            const opp = {fields}

            updateRecord(opp)
                .then(()=>{
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Quote Created',
                            message: 'Refresh Screen!!',
                            variant: 'success'
                        })
                    )
                }).then(()=>{
                    this.loaded = true;
                    this.dispatchEvent(new CloseActionScreenEvent());
                }).catch((error)=>{
                    this.error = JSON.stringify(error);
                    alert('error  '+this.error);
                    
                })
}
}