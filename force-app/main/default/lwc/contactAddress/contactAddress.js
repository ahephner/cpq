import { LightningElement, api, wire, track } from 'lwc';
import ACCID from '@salesforce/schema/Opportunity.AccountId';
import SHIPID from '@salesforce/schema/Opportunity.Shipping_Address__c';
import ID_FIELD from '@salesforce/schema/Opportunity.Id';
import {getRecord, getFieldValue, updateRecord } from 'lightning/uiRecordApi';
import Opportunity_Builder from '@salesforce/messageChannel/Opportunity_Builder__c';
import getAddress from '@salesforce/apex/cpqApex.getAddress'
import { MessageContext, publish} from 'lightning/messageService';
export default class ContactAddress extends LightningElement {
        @api recordId; 
        recId; 
        customer;
        selected; 
       // @track selectObj;
        @track options;
        isRendered = false;   
        error;
        showAddresses = true; 
    //Subscribe to Message Channel
    @wire(MessageContext)
    messageContext; 
//get context of the current order. Get the customerid to pass the function that gets avaliable address
//check and see if there is already a saved ship to 
        @wire(getRecord, {recordId: '$recordId', fields:[ACCID, SHIPID,ID_FIELD]})
            custFields({data, error}){
                if(data){
                    this.customer = getFieldValue(data,ACCID);
                    this.recId = getFieldValue(data, ID_FIELD)
                    this.findAddress(this.customer)
                    this.selected = getFieldValue(data, SHIPID);
                    console.log(1, this.recId, 2, this.recordId);
                    
                }else if(error){
                    this.error = error;
                }
            }
//get the avaliable ship to options
        findAddress(rec){
             getAddress({accID: rec})
                .then((res)=>{
                    this.options = res.map(item=>({
                                        ...item,
                                        label: item.Street +' ('+item.Name+') - '+item.City,
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
//if a ship to has already been selected set that value
//note as of now it puts the same option twice in the drop downs. 
            get selectedObj(){
                let label;
                    if(this.options && this.selected){
                        label = this.options.find((x)=>x.value===this.selected)
                    }
                    
                    return label;   
            }

//this event runs on change of the address. If it's new it opens the new address. 
//otherwise send to the order this is the ship to
        selectChange(event){
            let newValue = this.template.querySelector('.slds-select').value;
            if(newValue === "new"){
                this.template.querySelector('c-new-ship-address').openAddress(); 
            }else{
               // this.updateOpp(newValue); 
                const fields = {}
                fields[ID_FIELD.fieldApiName] = this.recordId;
                fields[SHIPID.fieldApiName] = newValue;
                const fieldsToUpdate = {fields}
                updateRecord(fieldsToUpdate).then(back=>{
                    const payLoad = {shipAddress: newValue}; 
                    //send to main comp
                    publish(this.messageContext,Opportunity_Builder, payLoad);
                    
                })

            }
        }
//listens for the new ship to address then pushs it to the avaliable array
        updateAddress(event){
            //console.log(this.options);
            
            let value = event.detail.value;
            
            let label = event.detail.label;
            let x = {value, label}
            this.options.push(x); 
            //console.log(typeof this.options);
            
        }
        // updateOpp(value){
        //     console.log(2, value);
            
        //         const fields = {};
        //         fields[ID_FIELD.fieldApiName] = this.recordId;
        //         fields[SHIPADD.fieldApiName] = value;
        //         console.log('hello');
                
        //         console.log(1, fields);
                
        //         const shipRec = {fields}
        //         updateRecord(shipRec)
        // }
}