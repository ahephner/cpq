import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue, updateRecord } from 'lightning/uiRecordApi';
import { CloseActionScreenEvent } from 'lightning/actions';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAddress from '@salesforce/apex/cpqApex.getAddress'
import SHIPTO from '@salesforce/schema/Opportunity.Shipping_Address__c';
import ACCID from '@salesforce/schema/Opportunity.AccountId';
import STAGE from '@salesforce/schema/Opportunity.StageName';
import ID_Field from '@salesforce/schema/Opportunity.Id';
import PDF_CHECKBOX from '@salesforce/schema/Opportunity.Generate_PDF_Quote_Checkbox__c';
import PEST_DATE from '@salesforce/schema/Opportunity.Pest_Expiration_Date__c';
const FIELDS = [SHIPTO, ACCID, STAGE, PDF_CHECKBOX,PEST_DATE];
const SUCCESS_TITLE = 'Quote is being Created';
const SUCCESS_MESS = 'Quote will be in the files section in a few mins depending on internet speed'
export default class CreateQuoteDesktop extends LightningElement { 
    @api recordId
    stage = 'Quote';
    //checking what the actual stage of the opp is. If closed/won we don't want to move back to quote
    stageFromRecord; 
    accountId; 
    shipTo; 
    pestExp;
    info = true;
    loaded = false; 
    options;
    error; 

    @wire(getRecord,{recordId: '$recordId', fields:FIELDS})
        loadFields({data,error}){
            if(data){
                this.shipTo = getFieldValue(data, SHIPTO); 
                this.accountId = getFieldValue(data, ACCID);
                this.stageFromRecord = getFieldValue(data, STAGE);
                this.pestExp = getFieldValue(data, PEST_DATE)
                console.log(1, this.shipTo, 2, this.accountId, 3,this.stageFromRecord, 4, this.pestExp);
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

cancelNewAddress(){ 
    this.info = true; 
}

updateAddress(event){
    let value = event.detail.value;
    
    let label = event.detail.label;
    let x = {value, label}
    this.options.push(x);
    this.info = true;
    const evt = new ShowToastEvent({
        title: 'Address Added',
        message: this.msg,
        variant: 'success'
    });
    this.dispatchEvent(evt);  
}

handleSave(){ 
    this.loaded = false;
    console.log(this.stageFromRecord)
    if(this.stageFromRecord != 'Quote' && this.stageFromRecord != 'Closed Won'){ 

    
    const fields = {}

            fields[STAGE.fieldApiName] = this.stage;
            fields[SHIPTO.fieldApiName] = this.shipTo;
            fields[ID_Field.fieldApiName] = this.recordId;
            fields[PDF_CHECKBOX.fieldApiName] = true;  
            const opp = {fields}
            updateRecord(opp)
            .then(()=>{
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: SUCCESS_TITLE,
                        message: SUCCESS_MESS, 
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
            }else{ 
                const fields = {}
                
                fields[SHIPTO.fieldApiName] = this.shipTo;
                fields[ID_Field.fieldApiName] = this.recordId;
                fields[PDF_CHECKBOX.fieldApiName] = true; 
                const opp = {fields}
                console.log(JSON.stringify(opp))
                
            updateRecord(opp)
                .then(()=>{
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: SUCCESS_TITLE,
                            message: SUCCESS_MESS,
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
}