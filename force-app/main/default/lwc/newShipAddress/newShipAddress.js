import { LightningElement, api } from 'lwc';
import OBJ from '@salesforce/schema/ContactPointAddress';
import NAME from '@salesforce/schema/ContactPointAddress.Name';
import PARENT from '@salesforce/schema/ContactPointAddress.ParentId';
import PICKUP from '@salesforce/schema/ContactPointAddress.New_Address__c';
import STREET from '@salesforce/schema/ContactPointAddress.Street';
import CITY from '@salesforce/schema/ContactPointAddress.City';
import STATE from '@salesforce/schema/ContactPointAddress.State';
import ZIP from '@salesforce/schema/ContactPointAddress.PostalCode';
import { createRecord  } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class NewShipAddress extends LightningElement{
        @api accId
        msg = 'Adding an address can slow quote acceptance by up to 10 mins in the system'
        showAddress=false;
        returnedId; 
        name 
        parent  
        street 
        state 
        city 
        zip 
        valid
        @api
        openAddress(){
            this.showAddress = true;
            this.parent = this.accId;  
        }

        closeModal(){
            this.showAddress = false; 
        }

        handleNewAddress(){
            let valid = this.validInfo();
            if(valid){
                const fields = {};

                fields[NAME.fieldApiName] = this.name;
                fields[PARENT.fieldApiName] = this.accId;
                fields[STREET.fieldApiName] = this.street;
                fields[STATE.fieldApiName] = this.state;
                fields[CITY.fieldApiName] = this.city;
                fields[ZIP.fieldApiName] = this.zip;
                fields[PICKUP.fieldApiName] = true;

                const recordInput = {apiName: OBJ.objectApiName, fields: fields}

                createRecord(recordInput)
                .then((res)=>{
                    this.returnedId = res.id; 
                    //console.log(JSON.stringify(res))
                    let addValues = {value: this.returnedId, label: this.street + ' ('+ this.name+')'};
                    console.log(1, addValues);
                    
                    const updateList = new CustomEvent("newaddress", {detail:addValues});
                    this.dispatchEvent(updateList);
                    console.log(2);
                    
                    
                }).then(a =>{
                    console.log(3);
                    const evt = new ShowToastEvent({
                        title: 'Address Added',
                        message: this.msg,
                        variant: 'success'
                    });
                    this.dispatchEvent(evt);
                    this.showAddress = false;
                    
                    this.name = '';
                    this.street = '';
                    this.state = '';
                    this.city = '';
                    this.zip = ''; 
                }).catch((err)=>{
                    alert('err '+JSON.stringify(err))
                })

            }else{
                console.log('bad address');
            }
            
        }

        handleChange(event){
            this.street = event.target.street;
            this.city = event.target.city;
            this.zip = event.target.postalCode;
            this.state =event.target.province;
            this.valid = event.target.valid; 
        }
        newName(e){
            this.name = e.detail.value; 
        }
        validInfo(){
            const addName = this.template.querySelector('lightning-input');
            const addFields = this.template.querySelector('lightning-input-address');
            const addNameValid = addName.checkValidity();
            const addFieldsValid = addFields.checkValidity();
                if(addNameValid && addFieldsValid){
                    return true; 
                }else{
                    return false; 
                    
                }
        }
}