import { LightningElement, api, wire } from 'lwc';
import { getObjectInfo, getPicklistValues} from 'lightning/uiObjectInfoApi';
import PRODUCT_OBJ from '@salesforce/schema/Product2';
import SUB_CAT from '@salesforce/schema/Product2.Subcategory__c';
import PROD_FAM from '@salesforce/schema/Product2.Product_Family__c';


export default class MobileSearchFilters extends LightningElement {
    exposed = false; 
    pf = 'All';
    cat = 'All';
    pfLabel = 'All';
    catLabel ='All';
    
   
    @api
    openFilter(){
        this.exposed = true; 
    }
    closeModal(){
        this.exposed = false; 
    }
    cancel(){
        this.pf = 'All';
        this.cat = 'All';
        this.updateFilter(this.cat, this.pf)
        this.closeModal(); 
    }
        //product family options needs to be fixed so it grabs all on load
        get pfOptions(){
            return [
                {label: 'All', value:'All'}, 
                {label: 'Foliar-Pak', value:'Foliar-Pak'},
                {label: 'BASF', value:'BASF'}, 
                {label: 'FMC', value:'FMC'}
            ]
        }
        //category options
        get catOptions(){
            return [
                {label: 'All', value: 'All'}, 
                {label: 'Herbicide', value:'Chemicals-Herbicide'},
                {label: 'Fungicide', value:'Chemicals-Fungicide'},
                {label: 'Insecticide', value:'Chemicals-Insecticide'},
                {label: 'PGR', value:'Chemicals-Growth Regulator'}, 
            ]
        }    
    
    catChange(x){
        this.cat = x.detail.value; 
        this.catLabel = x.target.options.find(opt => opt.value === x.detail.value).label;         
    }
    pfChange(x){
        this.pf = x.detail.value;  
    }

    updateFilter(){
        let filters = {cat: this.cat, catLab: this.catLabel, 
                       pf: this.pf}
        
        
        const updateFilter = new CustomEvent('filterchange',{detail: filters});
        this.dispatchEvent(updateFilter);      
        
        // this.closeModal(); 
        //close filter page
        const closeFilter = new CustomEvent('closefilter');
        this.dispatchEvent(closeFilter)
    }
}
    //  //need this to get picklist
    //  @wire(getObjectInfo, { objectApiName: PRODUCT_OBJ })
    //  objectInfo;
 
    //  //get sub category picklist
    //  @wire(getPicklistValues, {
    //      recordTypeId: "$objectInfo.data.defaultRecordTypeId",
    //      fieldApiName: SUB_CAT
    //    })
    //      subCatValues;
         
    //  //get product family picklist
    //  @wire(getPicklistValues, {
    //      recordTypeId: "$objectInfo.data.defaultRecordTypeId",
    //      fieldApiName: PROD_FAM
    //    })
    //    pfValues;
